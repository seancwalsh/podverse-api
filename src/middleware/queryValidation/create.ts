const Joi = require('joi')
import { validateBaseBody } from './base'

const validateMediaRefCreate = async (ctx, next) => {
  const schema = Joi.object().keys({
    authors: Joi.array().items(Joi.string()),
    categories: Joi.array().items(Joi.string()),
    description: Joi.string(),
    endTime: Joi.number().integer().min(1).allow(null).allow(''),
    episodeDuration: Joi.number().integer().min(0),
    episodeGuid: Joi.string(),
    episodeId: Joi.string(),
    episodeImageUrl: Joi.string().uri(),
    episodeLinkUrl: Joi.string().uri(),
    episodeMediaUrl: Joi.string().uri().required(),
    episodePubDate: Joi.date().iso(),
    episodeSummary: Joi.string(),
    episodeTitle: Joi.string(),
    isPublic: Joi.boolean(),
    podcastFeedUrl: Joi.string().uri(),
    podcastGuid: Joi.string(),
    podcastId: Joi.string(),
    podcastImageUrl: Joi.string().uri(),
    podcastIsExplicit: Joi.boolean(),
    podcastTitle: Joi.string(),
    startTime: Joi.number().integer().min(0).required(),
    title: Joi.string().allow(null).allow('')
  })

  await validateBaseBody(schema, ctx, next)
}

const validatePayPalOrderCreate = async (ctx, next) => {
  const schema = Joi.object().keys({
    paymentID: Joi.string(),
    payerID: Joi.string(),
    paymentToken: Joi.string(),
    state: Joi.string()
  })

  await validateBaseBody(schema, ctx, next)
}

const validatePlaylistCreate = async (ctx, next) => {
  const schema = Joi.object().keys({
    description: Joi.string(),
    isPublic: Joi.boolean(),
    itemsOrder: Joi.array().items(Joi.string()),
    mediaRefs: Joi.array().items(Joi.string()),
    title: Joi.string()
  })

  await validateBaseBody(schema, ctx, next)
}

const validateUserCreate = async (ctx, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().required(),
    historyItems: Joi.array().items(Joi.string()),
    name: Joi.string(),
    playlists: Joi.array().items(Joi.string()),
    subscribedPlaylistIds: Joi.array().items(Joi.string()),
    subscribedPodcastIds: Joi.array().items(Joi.string())
  })

  await validateBaseBody(schema, ctx, next)
}

export {
  validateMediaRefCreate,
  validatePayPalOrderCreate,
  validatePlaylistCreate,
  validateUserCreate
}