import { logger, connect, Rooms, RoomCustomMethods } from '@signalwire/core'
import {
  getDisplayMedia,
  BaseConnection,
  BaseConnectionOptions,
} from '@signalwire/webrtc'
import {
  RoomScreenShareObject,
  RoomDeviceObject,
  CreateScreenShareObjectOptions,
  AddDeviceOptions,
  AddCameraOptions,
  AddMicrophoneOptions,
  BaseRoomInterface,
  RoomMethods,
} from './utils/interfaces'
import { audioSetSpeakerAction } from './features/actions'
import { RoomScreenShare } from './RoomScreenShare'
import { RoomDevice } from './RoomDevice'

interface Room extends RoomMethods {}

class Room extends BaseConnection implements BaseRoomInterface {
  private _screenShareList = new Set<RoomScreenShareObject>()
  private _deviceList = new Set<RoomDeviceObject>()

  get screenShareList() {
    return Array.from(this._screenShareList)
  }

  get deviceList() {
    return Array.from(this._deviceList)
  }

  /**
   * Allow sharing the screen within the room.
   */
  async createScreenShareObject(opts: CreateScreenShareObjectOptions = {}) {
    const { autoJoin = true, audio = false, video = true } = opts
    const displayStream: MediaStream = await getDisplayMedia({ audio, video })
    const options: BaseConnectionOptions = {
      ...this.options,
      screenShare: true,
      recoverCall: false,
      localStream: displayStream,
      remoteStream: undefined,
    }

    const screenShare: RoomScreenShareObject = connect({
      store: this.store,
      Component: RoomScreenShare,
      componentListeners: {
        state: 'onStateChange',
        remoteSDP: 'onRemoteSDP',
        // TODO: find another way to namespace `screenShareObj`s
        nodeId: 'onNodeId',
        errors: 'onError',
        responses: 'onSuccess',
      },
    })(options)

    /**
     *  FIXME: Remove this workaround when
     * we get room.subscribed for screenShare
     * and device sessions.
     */
    screenShare._memberId = screenShare.id
    screenShare._roomId = this.roomId
    screenShare._roomSessionId = this.roomSessionId

    /**
     * Hangup if the user stop the screenShare from the
     * native browser button or if the videoTrack ends.
     */
    displayStream.getVideoTracks().forEach((t) => {
      t.addEventListener('ended', () => {
        if (screenShare && screenShare.active) {
          screenShare.hangup()
        }
      })
    })

    screenShare.on('destroy', () => {
      this._screenShareList.delete(screenShare)
    })

    try {
      this._screenShareList.add(screenShare)
      if (autoJoin) {
        await screenShare.join()
      }
      return screenShare
    } catch (error) {
      logger.error('ScreenShare Error', error)
      throw error
    }
  }

  /**
   * Allow to add a camera to the room.
   */
  addCamera(opts: AddCameraOptions = {}) {
    const { autoJoin = true, ...video } = opts
    return this.addDevice({
      autoJoin,
      video,
    })
  }

  /**
   * Allow to add a microphone to the room.
   */
  addMicrophone(opts: AddMicrophoneOptions = {}) {
    const { autoJoin = true, ...audio } = opts
    return this.addDevice({
      autoJoin,
      audio,
    })
  }

  /**
   * Allow to add additional devices to the room like cameras or microphones.
   */
  async addDevice(opts: AddDeviceOptions = {}) {
    const { autoJoin = true, audio = false, video = false } = opts
    if (!audio && !video) {
      throw new TypeError(
        'At least one of `audio` or `video` must be requested.'
      )
    }

    const options: BaseConnectionOptions = {
      ...this.options,
      localStream: undefined,
      remoteStream: undefined,
      audio,
      video,
      additionalDevice: true,
      recoverCall: false,
    }

    const roomDevice: RoomDeviceObject = connect({
      store: this.store,
      Component: RoomDevice,
      componentListeners: {
        state: 'onStateChange',
        remoteSDP: 'onRemoteSDP',
        // TODO: find another way to namespace `roomDeviceObj`s
        nodeId: 'onNodeId',
        errors: 'onError',
        responses: 'onSuccess',
      },
    })(options)

    /**
     *  FIXME: Remove this workaround when
     * we get room.subscribed for screenShare
     * and device sessions.
     */
    roomDevice._memberId = roomDevice.id
    roomDevice._roomId = this.roomId
    roomDevice._roomSessionId = this.roomSessionId

    roomDevice.on('destroy', () => {
      this._deviceList.delete(roomDevice)
    })

    try {
      this._deviceList.add(roomDevice)
      if (autoJoin) {
        await roomDevice.join()
      }
      return roomDevice
    } catch (error) {
      logger.error('RoomDevice Error', error)
      throw error
    }
  }

  join() {
    return super.invite()
  }

  leave() {
    return this.hangup()
  }

  updateSpeaker({ deviceId }: { deviceId: string }) {
    return this.triggerCustomSaga<undefined>(audioSetSpeakerAction(deviceId))
  }

  /** @internal */
  async hangup() {
    this._screenShareList.forEach((screenShare) => {
      screenShare.hangup()
    })
    this._deviceList.forEach((device) => {
      device.hangup()
    })

    return super.hangup()
  }

  /** @internal */
  protected _finalize() {
    this._screenShareList.clear()
    this._deviceList.clear()

    super._finalize()
  }
}

const customMethods: RoomCustomMethods<RoomMethods> = {
  audioMute: Rooms.audioMuteMember,
  audioUnmute: Rooms.audioUnmuteMember,
  videoMute: Rooms.videoMuteMember,
  videoUnmute: Rooms.videoUnmuteMember,
  deaf: Rooms.deafMember,
  undeaf: Rooms.undeafMember,
  setMicrophoneVolume: Rooms.setOutputVolumeMember,
  setSpeakerVolume: Rooms.setInputVolumeMember,
  setInputSensitivity: Rooms.setInputSensitivityMember,
  removeMember: Rooms.removeMember,
  getMemberList: Rooms.getMemberList,
  getLayoutList: Rooms.getLayoutList,
  setLayout: Rooms.setLayout,
  hideVideoMuted: Rooms.hideVideoMuted,
  showVideoMuted: Rooms.showVideoMuted,
}
Object.defineProperties(Room.prototype, customMethods)

export { Room }
