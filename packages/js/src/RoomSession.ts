import { UserOptions, logger } from '@signalwire/core'
import { createClient } from './createClient'
import type { MakeRoomOptions } from './Client'
import type { Room } from './Room'

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  aspectRatio: { ideal: 16 / 9 },
}

/**
 * List of properties/methods the user shouldn't be able to
 * use until they sucessfully call `roomSession.join()`.
 */
export const UNSAFE_PROP_ACCESS = [
  'audioMute',
  'audioUnmute',
  'deaf',
  'getLayouts',
  'getMembers',
  'getRecordings',
  'hideVideoMuted',
  'leave',
  'removerMember',
  'restoreOutboundAudio',
  'restoreOutboundVideo',
  'setInputSensitivity',
  'setInputVolume',
  'setLayout',
  'setOutputVolume',
  'showVideoMuted',
  'startRecording',
  'stopOutboundAudio',
  'stopOutboundVideo',
  'undeaf',
  'videoMute',
  'videoUnmute',
  'setMicrophoneVolume',
  'setSpeakerVolume',
]

export interface RoomSessionOptions extends UserOptions, MakeRoomOptions {}

export interface RoomSession extends Room {}

/**
 * @privateRemarks
 *
 * The use of a function expression as a contructor instead
 * of a class was picked because it made a couple things
 * simpler for this use case.
 * 1. Making classes behave as factories can be tricky when
 *    working with TypeScript since it's non trivial to
 *    switch the type returned by the constructor
 * 2. It also generates more verbose code (once transpiled)
 *    if we want to have private fields to store `room` and
 *    `client`.
 */
export const RoomSession = function (roomOptions: RoomSessionOptions) {
  const {
    audio = true,
    video = true,
    iceServers,
    rootElementId,
    applyLocalVideoOverlay = true,
    stopCameraWhileMuted = true,
    stopMicrophoneWhileMuted = true,
    speakerId,
    ...userOptions
  } = roomOptions

  const client = createClient(userOptions)
  const room = client.rooms.makeRoomObject({
    audio,
    video: video === true ? VIDEO_CONSTRAINTS : video,
    negotiateAudio: true,
    negotiateVideo: true,
    iceServers,
    rootElementId,
    applyLocalVideoOverlay,
    stopCameraWhileMuted,
    stopMicrophoneWhileMuted,
    speakerId,
  })

  // WebRTC connection left the room.
  room.once('destroy', () => {
    client.disconnect()
  })

  const join = async () => {
    try {
      await client.connect()
      await room.join()
    } catch (e) {
      logger.error(e)
      throw e
    }
    return room
  }

  return new Proxy<RoomSession>(room, {
    get(target: Room, prop: any, receiver: any) {
      if (prop === 'join') {
        return join
      }

      if (!target.active && UNSAFE_PROP_ACCESS.includes(prop)) {
        throw new Error(
          `Tried to access the property/method "${prop}" before the room was connected. Please call roomSession.join() first.`
        )
      }

      return Reflect.get(target, prop, receiver)
    },
  })
  // For consistency with other constructors we'll make TS force the use of `new`
} as unknown as { new (roomOptions: RoomSessionOptions): RoomSession }
