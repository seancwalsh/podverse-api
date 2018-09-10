import { Episode, MediaRef, Podcast } from 'entities'
import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, ManyToMany,
  PrimaryColumn, UpdateDateColumn } from 'typeorm'

const shortid = require('shortid')

@Entity('authors')
export class Author {

  @PrimaryColumn('varchar', {
    default: shortid.generate(),
    length: 14
  })
  id: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToMany(type => Episode, episode => episode.authors)
  episodes: Episode[]

  @ManyToMany(type => MediaRef, mediaRef => mediaRef.authors)
  mediaRefs: MediaRef[]

  @ManyToMany(type => Podcast, podcast => podcast.authors)
  podcasts: Podcast[]

  @Column({ unique: true })
  name: string

  @Column({ unique: true })
  slug: string

  @BeforeInsert()
  @BeforeUpdate()
  beforeAll () {
    this.slug = this.name.replace(/\s+/g, '-').toLowerCase()
    this.name = this.name.trim()
  }

  @BeforeInsert()
  beforeInsert () {
    this.id = shortid.generate()
  }

}