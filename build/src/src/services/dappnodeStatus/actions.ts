import { ThunkAction } from "redux-thunk";
import { AnyAction } from "redux";
import * as t from "./types";
import {
  SystemInfo,
  HostStats,
  Diagnose,
  AutoUpdateDataView,
  MountpointData,
  VolumeData,
  PackageVersionData,
  EthClientTarget
} from "types";
import * as api from "API/calls";
import { confirm } from "components/ConfirmDialog";
import { getEthClientTarget } from "./selectors";
import { getEthClientPrettyName } from "components/EthMultiClient";

// Service > dappnodeStatus

// Redux-thunk

export const changeEthClientTarget = (
  nextTarget: EthClientTarget
): ThunkAction<void, {}, null, AnyAction> => async (_, getState) => {
  const prevTarget = getEthClientTarget(getState());

  // Make sure the target has changed or the call will error
  if (nextTarget === prevTarget) return;

  // If the previous target is package, ask the user if deleteVolumes
  const deleteVolumes =
    prevTarget && prevTarget !== "remote"
      ? await new Promise((resolve: (_deleteVolumes: boolean) => void) =>
          confirm({
            title: `Remove ${getEthClientPrettyName(prevTarget)} volumes?`,
            text: `Do you want to keep or remove the volumes of your current Ethereum client? This action cannot be undone.`,
            buttons: [
              {
                label: "Keep",
                variant: "dappnode",
                onClick: () => resolve(false)
              },
              {
                label: "Remove",
                variant: "danger",
                onClick: () => resolve(true)
              }
            ]
          })
        )
      : false;

  await api
    .ethClientTargetSet(
      { target: nextTarget, deleteVolumes },
      { toastMessage: "Changing Eth client..." }
    )
    .catch(console.error);
};

// Update

export const setSystemInfo = (systemInfo: SystemInfo) => ({
  type: t.SET_SYSTEM_INFO,
  systemInfo
});

export const updateVpnVersionData = (vpnVersionData: PackageVersionData) => ({
  type: t.UPDATE_VPN_VERSION_DATA,
  vpnVersionData
});

export const updateDappnodeStats = (stats: HostStats) => ({
  type: t.UPDATE_DAPPNODE_STATS,
  stats
});

export const updateDappnodeDiagnose = (diagnose: Diagnose) => ({
  type: t.UPDATE_DAPPNODE_DIAGNOSE,
  diagnose
});

export const updatePingReturn = (dnp: string, pingReturn: boolean) => ({
  type: t.UPDATE_PING_RETURN,
  dnp,
  pingReturn
});

export const updateIpfsConnectionStatus = (ipfsConnectionStatus: {
  resolves: boolean;
  error?: string;
}) => ({
  type: t.UPDATE_IPFS_CONNECTION_STATUS,
  ipfsConnectionStatus
});

export const updateWifiStatus = (wifiStatus: { running: boolean }) => ({
  type: t.UPDATE_WIFI_STATUS,
  wifiStatus
});

export const updatePasswordIsInsecure = (passwordIsInsecure: boolean) => ({
  type: t.UPDATE_PASSWORD_IS_INSECURE,
  passwordIsInsecure
});

export const updateAutoUpdateData = (autoUpdateData: AutoUpdateDataView) => ({
  type: t.UPDATE_AUTO_UPDATE_DATA,
  autoUpdateData
});

export const updateIdentityAddress = (identityAddress: string) => ({
  type: t.UPDATE_IDENTITY_ADDRESS,
  identityAddress
});

export const updateMountpoints = (mountpoints: MountpointData[]) => ({
  type: t.UPDATE_MOUNTPOINTS,
  mountpoints
});

export const updateVolumes = (volumes: VolumeData[]) => ({
  type: t.UPDATE_VOLUMES,
  volumes
});

// Fetch

export const fetchAllDappnodeStatus = () => ({
  type: t.FETCH_ALL_DAPPNODE_STATUS
});

export const fetchDappnodeParams = () => ({
  type: t.FETCH_DAPPNODE_PARAMS
});

export const fetchDappnodeStats = () => ({
  type: t.FETCH_DAPPNODE_STATS
});

export const fetchDappnodeDiagnose = () => ({
  type: t.FETCH_DAPPNODE_DIAGNOSE
});

export const fetchIfPasswordIsInsecure = () => ({
  type: t.FETCH_IF_PASSWORD_IS_INSECURE
});

export const fetchMountpoints = () => ({
  type: t.FETCH_MOUNTPOINTS
});
