import { connectionStore } from './store'
import { notifyLog } from './notifyLog'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'

export function unsubscribe(topic: NotifyTopic): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!connectionStore.isPendingUnsub(topic)) {
      connectionStore
        .setUnsubStatus(topic, 'pending')
        .then(() => {
          const { client } = connectionStore
          if (client == null) {
            reject(new Error('Expected hostData, received null.'))
            return
          }

          client.unsubscribe(topic, {}, (error, result) => {
            const { robotName, ip } = connectionStore
            if (error != null) {
              notifyLog.debug(
                `Failed to unsubscribe to ${robotName} on ${ip} from topic: ${topic}`
              )
            } else {
              notifyLog.debug(
                `Successfully unsubscribed to ${robotName} on ${ip} from topic: ${topic}`
              )
              connectionStore
                .setUnsubStatus(topic, 'unsubscribed')
                .catch((error: Error) => notifyLog.debug(error.message))
            }
          })
        })
        .catch((error: Error) => notifyLog.debug(error.message))
    }
  })
}
