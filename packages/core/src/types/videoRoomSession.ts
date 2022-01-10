import type { SwEvent } from '.'
import type {
  CamelToSnakeCase,
  EntityUpdated,
  ToInternalVideoEvent,
  MemberCommandParams,
  MemberCommandWithValueParams,
  MemberCommandWithVolumeParams,
  OnlyFunctionProperties,
  OnlyStateProperties,
} from './utils'
import type { InternalVideoMemberEntity } from './videoMember'
import * as Rooms from '../rooms'

/**
 * Public event types
 */
export type RoomStarted = 'room.started'
export type RoomSubscribed = 'room.subscribed'
export type RoomUpdated = 'room.updated'
export type RoomEnded = 'room.ended'

// Generated by the SDK
export type RoomJoined = 'room.joined'

/**
 * List of public event names
 */
export type VideoRoomSessionEventNames =
  | RoomStarted
  | RoomSubscribed
  | RoomJoined
  | RoomUpdated
  | RoomEnded

/**
 * List of internal events
 * @internal
 */
export type InternalVideoRoomSessionEventNames =
  ToInternalVideoEvent<VideoRoomSessionEventNames>

/**
 * Public Contract for a VideoRoomSession
 */
export interface VideoRoomSessionContract {
  /** Unique id for this room session */
  id: string
  /** Display name for this room. Defaults to the value of `name` */
  displayName: string
  /** Id of the room associated to this room session */
  roomId: string
  /** @internal */
  eventChannel: string
  /** Name of this room */
  name: string
  /** Whether recording is active */
  recording: boolean
  /** Whether muted videos are shown in the room layout. See {@link setHideVideoMuted} */
  hideVideoMuted: boolean
  /** URL to the room preview. */
  previewUrl?: string

  audioMute(params?: MemberCommandParams): Rooms.AudioMuteMember
  audioUnmute(params?: MemberCommandParams): Rooms.AudioUnmuteMember
  videoMute(params?: MemberCommandParams): Rooms.VideoMuteMember
  videoUnmute(params?: MemberCommandParams): Rooms.VideoUnmuteMember
  /** @deprecated Use {@link setInputVolume} instead. */
  setMicrophoneVolume(
    params: MemberCommandWithVolumeParams
  ): Rooms.SetInputVolumeMember
  setInputVolume(
    params: MemberCommandWithVolumeParams
  ): Rooms.SetInputVolumeMember
  setInputSensitivity(
    params: MemberCommandWithValueParams
  ): Rooms.SetInputSensitivityMember
  getMembers(): Rooms.GetMembers
  deaf(params?: MemberCommandParams): Rooms.DeafMember
  undeaf(params?: MemberCommandParams): Rooms.UndeafMember
  /** @deprecated Use {@link setOutputVolume} instead. */
  setSpeakerVolume(
    params: MemberCommandWithVolumeParams
  ): Rooms.SetOutputVolumeMember
  setOutputVolume(
    params: MemberCommandWithVolumeParams
  ): Rooms.SetOutputVolumeMember
  removeMember(params: Required<MemberCommandParams>): Rooms.RemoveMember
  setHideVideoMuted(value: boolean): Rooms.SetHideVideoMuted
  getLayouts(): Rooms.GetLayouts
  setLayout(params: Rooms.SetLayoutParams): Rooms.SetLayout
  setPositions(params: Rooms.SetPositionsParams): Rooms.SetPositions
  setPosition(params: Rooms.SetPositionParams): Rooms.SetPosition
  getRecordings(): Rooms.GetRecordings
  startRecording(): Promise<Rooms.RoomSessionRecording>
  getPlaybacks(): Rooms.GetPlaybacks
  play(params: Rooms.PlayParams): Promise<Rooms.RoomSessionPlayback>
}

/**
 * VideoRoomSession properties
 */
export type VideoRoomSessionEntity =
  OnlyStateProperties<VideoRoomSessionContract>
/**
 * VideoRoomSession methods
 */
export type VideoRoomSessionMethods =
  OnlyFunctionProperties<VideoRoomSessionContract>

/**
 * VideoRoomSessionEntity plus `updated` field
 */
export type VideoRoomSessionEntityUpdated =
  EntityUpdated<VideoRoomSessionEntity>

/**
 * VideoRoomSessionEntity for internal usage (converted to snake_case)
 * @internal
 */
export type InternalVideoRoomSessionEntity = {
  [K in NonNullable<
    keyof VideoRoomSessionEntity
  > as CamelToSnakeCase<K>]: VideoRoomSessionEntity[K]
}

/**
 * VideoRoomEntity for internal usage only: backwards compat.
 * @internal
 * @deprecated
 */
type InternalVideoRoomEntity = {
  room_id: string
  room_session_id: string
  event_channel: string
  name: string
  recording: boolean
  hide_video_muted: boolean
  preview_url?: string
}

/**
 * VideoRoomSessionEntity plus `updated` field
 * for internal usage (converted to snake_case)
 * @internal
 */
export type InternalVideoRoomUpdated =
  EntityUpdated<InternalVideoRoomSessionEntity>

export interface InternalVideoRoomJoinedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<RoomJoined>
  params: VideoRoomSubscribedEventParams
}

export type InternalVideoRoomEvent = InternalVideoRoomJoinedEvent

/**
 * ==========
 * ==========
 * Server-Side Events
 * ==========
 * ==========
 */

/**
 * 'video.room.started'
 */
export interface VideoRoomStartedEventParams {
  room_id: string
  room_session_id: string
  // keep room for backward compat
  room: InternalVideoRoomEntity
  room_session: InternalVideoRoomSessionEntity
}

export interface VideoRoomStartedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<RoomStarted>
  params: VideoRoomStartedEventParams
}

/**
 * 'video.room.subscribed'
 */
export interface VideoRoomSubscribedEventParams {
  // keep room for backward compat
  room: InternalVideoRoomEntity & {
    members: InternalVideoMemberEntity[]
    // TODO: add recordings[] and other bootstrap things
  }
  room_session: InternalVideoRoomSessionEntity & {
    members: InternalVideoMemberEntity[]
    // TODO: add recordings[] and other bootstrap things
  }
  // FIXME: only for webrtc
  call_id: string
  member_id: string
}

export interface VideoRoomSubscribedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<RoomSubscribed>
  params: VideoRoomSubscribedEventParams
}

/**
 * 'video.room.updated'
 */
export interface VideoRoomUpdatedEventParams {
  room_id: string
  room_session_id: string
  // keep room for backward compat
  room: InternalVideoRoomEntity
  room_session: InternalVideoRoomSessionEntity
}

export interface VideoRoomUpdatedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<RoomUpdated>
  params: VideoRoomUpdatedEventParams
}

/**
 * 'video.room.ended'
 */
export interface VideoRoomEndedEventParams {
  room_id: string
  room_session_id: string
  // keep room for backward compat
  room: InternalVideoRoomEntity
  room_session: InternalVideoRoomSessionEntity
}

export interface VideoRoomEndedEvent extends SwEvent {
  event_type: ToInternalVideoEvent<RoomEnded>
  params: VideoRoomEndedEventParams
}

export type VideoRoomEvent =
  | VideoRoomStartedEvent
  | VideoRoomSubscribedEvent
  | VideoRoomUpdatedEvent
  | VideoRoomEndedEvent

export type VideoRoomEventParams =
  | VideoRoomStartedEventParams
  | VideoRoomSubscribedEventParams
  | VideoRoomUpdatedEventParams
  | VideoRoomEndedEventParams
