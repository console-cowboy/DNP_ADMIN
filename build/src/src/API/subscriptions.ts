import store from "../store";
import autobahn from "autobahn";
import { registerSubscriptions } from "../registerSubscriptions";
// Actions to push received content
import { pushNotificationFromDappmanager } from "services/notifications/actions";
import { updateChainData } from "services/chainData/actions";
import { updateDevices } from "services/devices/actions";
import { pushUserActionLog } from "services/userActionLogs/actions";
import {
  clearIsInstallingLog,
  updateIsInstallingLog
} from "services/isInstallingLogs/actions";
import {
  updateAutoUpdateData,
  updateVolumes,
  setSystemInfo
} from "services/dappnodeStatus/actions";
import { setDnpInstalled } from "services/dnpInstalled/actions";
import { setDnpDirectory } from "services/dnpDirectory/actions";

export default function subscriptions(session: autobahn.Session) {
  const wampSubscriptions = registerSubscriptions(session, errorMessage => {
    console.error(errorMessage);
  });
  /**
   * Utilities to encode arguments to publish with the Crossbar format (args, kwargs)
   * - Publisher:
   *     publish("event.name", arg1, arg2)
   * - Subscriber:
   *     session.subscribe("event.name", args => {
   *       listener(...args)
   *     })
   */
  // function publish(event, ...args) {
  //   // session.publish(topic, args, kwargs, options)
  //   session.publish(event, args);
  // }
  function subscribe<T>(event: string, cb: (arg: T) => void) {
    // session.subscribe(topic, function(args, kwargs, details) )
    session.subscribe(event, (arg: T) => {
      try {
        cb(arg);
      } catch (e) {
        console.error(`Error on WAMP ${event}: ${e.stack}`);
      }
    });
  }

  wampSubscriptions.autoUpdateData.on(autoUpdateData => {
    store.dispatch(updateAutoUpdateData(autoUpdateData));
  });

  wampSubscriptions.chainData.on(chainsData => {
    store.dispatch(updateChainData(chainsData));
  });

  wampSubscriptions.directory.on(directoryDnps => {
    store.dispatch(setDnpDirectory(directoryDnps));
  });

  wampSubscriptions.packages.on(dnpsInstalled => {
    store.dispatch(setDnpInstalled(dnpsInstalled));
  });

  wampSubscriptions.progressLog.on(progressLog => {
    const { id, name: dnpName, message: log, clear } = progressLog;
    if (clear) store.dispatch(clearIsInstallingLog({ id }));
    else store.dispatch(updateIsInstallingLog({ id, dnpName, log }));
  });

  wampSubscriptions.pushNotification.on(notification => {
    store.dispatch(pushNotificationFromDappmanager(notification));
  });

  wampSubscriptions.systemInfo.on(systemInfo => {
    store.dispatch(setSystemInfo(systemInfo));
  });

  wampSubscriptions.userActionLog.on(userActionLog => {
    store.dispatch(pushUserActionLog(userActionLog));
  });

  wampSubscriptions.volumes.on(volumes => {
    store.dispatch(updateVolumes(volumes));
  });

  // The DAPPMANAGER may ask the UI to reload
  wampSubscriptions.reloadClient.on(data => {
    console.log(`DAPPMANAGER triggered a client reload`, data);
    // If we needed to pull the document from the web-server again (such as where
    // the document contents change dynamically) we would pass the argument as 'true'.
    window.location.reload(true);
  });

  /**
   * [VPN] (un-typed)
   *
   * @param {array} devices = [{
   *   id: "MyPhone",
   *   isAdmin: false
   * }, ... ]
   */
  subscribe("devices.vpn.dnp.dappnode.eth", ([devices]: any[]) => {
    store.dispatch(updateDevices(devices));
  });
}
