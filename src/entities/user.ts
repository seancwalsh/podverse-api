import { IsEmail, IsUUID, Validate, ValidateIf } from 'class-validator'
import { BeforeInsert, Column, CreateDateColumn, Entity,
  OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { MediaRef, Playlist } from 'entities'
import { ValidatePassword } from 'entities/validation/password'
import { NowPlayingItem } from 'lib/utility/nowPlayingItem';

const shortid = require('shortid')

@Entity('users')
export class User {

  @PrimaryColumn('varchar', {
    default: shortid.generate(),
    length: 14
  })
  id: string

  @IsEmail()
  @Column({
    select: false,
    unique: true
  })
  email: string

  @ValidateIf(a => a.emailVerificationToken != null)
  @IsUUID()
  @Column({
    nullable: true,
    select: false,
    unique: true
  })
  emailVerificationToken: string

  @Column({
    nullable: true,
    select: false
  })
  emailVerificationTokenExpiration: Date

  @Column({
    default: false,
    select: false
  })
  emailVerified: boolean

  @Column({ nullable: true })
  name: string

  @Validate(ValidatePassword)
  @Column({ select: false })
  password: string

  @ValidateIf(a => a.resetPasswordToken != null)
  @IsUUID()
  @Column({
    nullable: true,
    select: false,
    unique: true
  })
  resetPasswordToken: string

  @Column({
    nullable: true,
    select: false
  })
  resetPasswordTokenExpiration: Date

  @Column('varchar', {
    array: true,
    select: false
  })
  subscribedPodcastIds: string[]

  @Column('simple-json', { select: false })
  historyItems: NowPlayingItem[]

  @Column('simple-json', { select: false })
  queueItems: NowPlayingItem[]

  @OneToMany(type => MediaRef, mediaRefs => mediaRefs.owner)
  mediaRefs: MediaRef[]

  @OneToMany(type => Playlist, playlist => playlist.owner, {
    cascade: true
  })
  playlists: Playlist[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  beforeInsert () {
    this.id = shortid.generate()
    this.subscribedPodcastIds = this.subscribedPodcastIds || []
  }

}
