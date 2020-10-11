import axios from 'axios'
import { config } from '~/config'
import { getConnection } from "typeorm"
import { connectToDb } from '~/lib/db'
import { removeProtocol } from '~/lib/utility'
import { addFeedUrlsByAuthorityIdToPriorityQueue } from './queue'
const shortid = require('shortid')
const sha1 = require('crypto-js/sha1')
const encHex = require('crypto-js/enc-hex')
const csv = require('csvtojson')
const { podcastIndexConfig, userAgent } = config

const apiHeaderTime = new Date().getTime() / 1000;
const hash = sha1(
  config.podcastIndexConfig.authKey + config.podcastIndexConfig.secretKey + apiHeaderTime
).toString(encHex);

const getRecentlyUpdatedPodcastFeeds = async () => {
  const { getRecentlyUpdatedSinceTime } = podcastIndexConfig
  const currentTime = new Date().getTime()
  const startRangeTime = Math.floor((currentTime - getRecentlyUpdatedSinceTime) / 1000)

  console.log('currentTime----', currentTime)
  console.log('startRangeTime-', startRangeTime)

  const url = `${podcastIndexConfig.baseUrl}/podcasts/updated?since=${startRangeTime}&max=1000`

  console.log('url------------', url)

  const response = await axios({
    url,
    method: 'GET',
    headers: {
      'User-Agent': userAgent,
      'X-Auth-Key': podcastIndexConfig.authKey,
      'X-Auth-Date': apiHeaderTime,
      'Authorization': hash
    }
  })

  return response && response.data
}

/**
 * addRecentlyUpdatedFeedUrlsToPriorityQueue
 * 
 * Request a list of all podcast feeds that have been updated
 * within the past X minutes from Podcast Index, then add
 * the feeds that have a matching authorityId in our database
 * to the queue for parsing.
 */
export const addRecentlyUpdatedFeedUrlsToPriorityQueue = async () => {
  try {
    const response = await getRecentlyUpdatedPodcastFeeds()
    const recentlyUpdatedFeeds = response.feeds

    console.log('total recentlyUpdatedFeeds count', recentlyUpdatedFeeds.length)

    const recentlyUpdatedAuthorityIds = [] as any[]
    for (const item of recentlyUpdatedFeeds) {
      const { itunesId, language } = item
      if (itunesId && language) {
        recentlyUpdatedAuthorityIds.push(itunesId)
      }
    }
    
    const uniqueAuthorityIds = [...new Set(recentlyUpdatedAuthorityIds)].slice(0, 1000);

    console.log('unique recentlyUpdatedAuthorityIds count', uniqueAuthorityIds.length)

    // Send the feedUrls with matching authorityIds found in our database to
    // the priority parsing queue for immediate parsing.
    if (recentlyUpdatedAuthorityIds.length > 0) {
      await addFeedUrlsByAuthorityIdToPriorityQueue(uniqueAuthorityIds)
    }
  } catch (error) {
    console.log('addRecentlyUpdatedFeedUrlsToPriorityQueue', error)
  }
}

/**
 * syncWithFeedUrlsCSVDump
 * 
 * Basically, this function parses a CSV file of feed URLs provided by Podcast Index,
 * then adds each feed URL to our database if it doesn't already exist,
 * and retires the previous feed URLs saved in our database for that podcast if any exist.
 * 
 * Longer explanation...
 * This looks for a file named podcastIndexFeedUrlsDump.csv, then iterates through
 * every podcastIndexItem in the file, and if the podcastIndexItem has an itunes_id (authorityId),
 * then it retrieves all existing feedUrls in our database that have a matching
 * itunes_id. If no matching feedUrls exist, then it creates a new feedUrl
 * using the podcastIndexItem's information. If matching feedUrls do exist, then it
 * promotes the podcastIndexItem's url to be the current feedUrl for that podcast,
 * and demotes any other feedUrls for that podcast.
 * 
 * The feedUrl promotion/demotion step is needed because a single podcast can have
 * numerous feedUrl's over its lifetime. Our database keeps references to old feedUrls,
 * so we need to make sure only the current feedUrl is the current "authority" for that podcast.
 */
export const syncWithFeedUrlsCSVDump = async (rootFilePath) => {
  await connectToDb()

  try {
    const csvFilePath = `${rootFilePath}/temp/podcastIndexFeedUrlsDump.csv`;
    const client = await getConnection().createEntityManager()
    await csv()
      .fromFile(csvFilePath)
      .subscribe((json) => {
        return new Promise(async (resolve) => {
          await new Promise(r => setTimeout(r, 2000));

          try {
            await createOrUpdatePodcastFromPodcastIndex(client, json)
          } catch (error) {
            console.log('podcastIndex:syncWithFeedUrlsCSVDump subscribe error', error)
          }

          resolve()
        })
      })
  } catch (error) {
    console.log('podcastIndex:syncWithFeedUrlsCSVDump', error)
  }
}

async function createOrUpdatePodcastFromPodcastIndex(client, item) {
  console.log('-----------------------------------')
  console.log('createOrUpdatePodcastFromPodcastIndex')

  if (!item) {
    console.log('no item found')
  } else {
    const podcastTitle = item.title
    const url = item.url
    const podcastIndexId = item.id
    const itunesId = item.itunes_id

    // Currently only adding podcasts automatically that have an itunes_id
    if (!itunesId) return

    console.log('podcast title', podcastTitle)
    console.log('feed url', url)
    
    let existingPodcast = await getExistingPodcast(client, itunesId)

    if (!existingPodcast) {
      console.log('podcast does not already exist')
      const isPublic = true

      await client.query(`
        INSERT INTO podcasts (id, "authorityId", "podcastIndexId", "title", "isPublic")
        VALUES ($1, $2, $3, $4, $5);
      `, [shortid(), itunesId, podcastIndexId, podcastTitle, isPublic])

      existingPodcast = await getExistingPodcast(client, itunesId)
    } else {
      console.log('podcast already exists')
    }

    const existingFeedUrls = await client.query(`
      SELECT id, url
      FROM "feedUrls"
      WHERE "podcastId"=$1
    `, [existingPodcast.id])
    
    console.log('existingFeedUrls count', existingFeedUrls.length)

    for (const existingFeedUrl of existingFeedUrls) {
      console.log('existingFeedUrl url / id', existingFeedUrl.url, existingFeedUrl.id)

      const isMatchingFeedUrl = removeProtocol(url) === removeProtocol(url)

      await client.query(`
        UPDATE "feedUrls"
        SET "isAuthority"=${isMatchingFeedUrl ? 'TRUE' : 'FALSE'}
        WHERE id=$1
      `, [existingFeedUrl.id])
    }

    const updatedFeedUrlResults = await client.query(`
      SELECT id, url
      FROM "feedUrls"
      WHERE url=$1
    `, [url])
    const updatedFeedUrl = updatedFeedUrlResults[0]
    console.log('updatedFeedUrl', updatedFeedUrl)

    if (updatedFeedUrl) {
      console.log('updatedFeedUrl already exists url / id', updatedFeedUrl.url, updatedFeedUrl.id)
    } else {
      console.log('updatedFeedUrl does not exist url / id')
      const isAuthority = true
      await client.query(`
        INSERT INTO "feedUrls" (id, "isAuthority", "url", "podcastId")
        VALUES ($1, $2, $3, $4);
      `, [shortid(), isAuthority, url, existingPodcast.id])
    }
  }
  console.log('*** finished entry')
}

const getExistingPodcast = async (client, authorityId) => {
  if (!authorityId) {
    return null
  }

  const podcasts = await client.query(`
    SELECT "authorityId", "podcastIndexId", id, title
    FROM podcasts
    WHERE "authorityId"=$1;
  `, [authorityId])

  return podcasts[0]
}
