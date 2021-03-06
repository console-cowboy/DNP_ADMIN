import React, { useState, useEffect, useCallback, useMemo } from "react";
import { mapValues } from "lodash";
// Components
import Card from "components/Card";
import Alert from "react-bootstrap/Alert";
import FormJsonSchema from "./FormJsonSchema";
import {
  SetupSchemaAllDnps,
  SetupUiJsonAllDnps,
  UserSettingsAllDnps,
  SetupTargetAllDnps
} from "types";
import { SetupSchemaAllDnpsFormated } from "types-own";
import { shortNameCapitalized } from "utils/format";
import OldEditor from "./OldEditor";
import {
  formDataToUserSettings,
  userSettingsToFormData,
  getUserSettingsDataErrors
} from "pages/installer/parsers/formDataParser";
import { SetupWizardFormDataReturn } from "pages/installer/types";
import deepmerge from "deepmerge";
import { selectMountpointId } from "./SelectMountpoint";
import { nullFieldId } from "./NullField";
import { USER_SETTING_DISABLE_TAG, MOUNTPOINT_DEVICE_LEGACY_TAG } from "params";

interface SetupWizardProps {
  setupSchema: SetupSchemaAllDnps;
  setupTarget: SetupTargetAllDnps;
  setupUiJson: SetupUiJsonAllDnps;
  userSettings: UserSettingsAllDnps;
  prevUserSettings: UserSettingsAllDnps;
  wizardAvailable: boolean;
  onSubmit: (newUserSettings: UserSettingsAllDnps) => void;
  goBack: () => void;
}

const SetupWizard: React.FunctionComponent<SetupWizardProps> = ({
  setupSchema,
  setupTarget,
  setupUiJson,
  userSettings,
  prevUserSettings,
  wizardAvailable,
  onSubmit,
  goBack
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dataErrors, setDataErrors] = useState([] as string[]);
  const [editorData, setEditorData] = useState({} as UserSettingsAllDnps);
  const [wizardData, setWizardData] = useState({} as SetupWizardFormDataReturn);

  useEffect(() => {
    setEditorData(userSettings);
    setWizardData(userSettingsToFormData(userSettings, setupTarget));
  }, [userSettings, setupTarget]);

  // [NOTE]: All handlers for the FormJsonSchema are memoized to prevent
  // expensive re-renders that cause serious performance issues
  // (100% CPU + freezing for 200-500 ms)

  // Move data from the wizard to the editor
  // Deepmerge to include settings not found in the wizard schema
  // Store the wizard data for cache in the case th user switches back
  const onShowAdvancedEditor = useCallback(
    formData => {
      setEditorData(_editorData =>
        deepmerge(_editorData, formDataToUserSettings(formData, setupTarget))
      );
      setWizardData(formData);
      setShowAdvanced(true);
    },
    [setupTarget, setEditorData, setWizardData, setShowAdvanced]
  );

  // Move data from the editor to the wizard
  // Deepmerge to include data not found in the user settings (fileUploads)
  const onHideAdvancedEditor = useCallback(() => {
    setWizardData(_wizardData =>
      deepmerge(_wizardData, userSettingsToFormData(editorData, setupTarget))
    );
    setShowAdvanced(false);
  }, [setupTarget, setWizardData, editorData, setShowAdvanced]);

  const submit = useCallback(
    (newUserSettings: UserSettingsAllDnps) => {
      const errors = getUserSettingsDataErrors(newUserSettings);
      setDataErrors(errors);
      if (!errors.length) onSubmit(newUserSettings);
    },
    [setDataErrors, onSubmit]
  );

  // Merge wizard data with the editor data. Give priority to the wizard data
  const onWizardSubmit = useCallback(
    formData => {
      const wizardSettings = formDataToUserSettings(formData, setupTarget);
      submit(deepmerge(editorData, wizardSettings));
    },
    [submit, setupTarget, editorData]
  );

  // Merge editor data with the wizard data. Give priority to the editor data
  const onOldEditorSubmit = useCallback(() => {
    if (wizardAvailable) {
      const wizardSettings = formDataToUserSettings(wizardData, setupTarget);
      submit(deepmerge(wizardSettings, editorData));
    } else {
      submit(editorData);
    }
  }, [submit, setupTarget, wizardAvailable, wizardData, editorData]);

  // Pretify the titles of the DNP sections
  // and convert it to a valid JSON schema where the top properties are each DNP
  const setupSchemaFormated: SetupSchemaAllDnpsFormated = useMemo(() => {
    return {
      type: "object",
      properties: mapValues(setupSchema, (schema, dnpName) => ({
        title: shortNameCapitalized(dnpName),
        ...schema
      }))
    };
  }, [setupSchema]);

  // Must use prevUserSettings, since userSettings can change if the user
  // navigates back and forward to the InstallDnpView component
  const setupUiJsonFormated: SetupUiJsonAllDnps = useMemo(() => {
    const _formData = userSettingsToFormData(prevUserSettings, setupTarget);
    return mapValues(setupTarget, (_0, dnpName) => {
      return deepmerge(
        setupUiJson[dnpName] || {},
        mapValues(setupTarget[dnpName] || {}, (setupTargetDnp, propName) => {
          const propValue = (_formData[dnpName] || {})[propName] || "";
          if (
            propValue === USER_SETTING_DISABLE_TAG &&
            (setupTargetDnp.type === "namedVolumeMountpoint" ||
              setupTargetDnp.type === "allNamedVolumesMountpoint" ||
              setupTargetDnp.type === "fileUpload")
          ) {
            return {
              "ui:field": nullFieldId
            };
          }
          if (
            setupTargetDnp.type === "namedVolumeMountpoint" ||
            setupTargetDnp.type === "allNamedVolumesMountpoint"
          ) {
            const isLegacy = propValue.startsWith(MOUNTPOINT_DEVICE_LEGACY_TAG);
            return {
              "ui:widget": selectMountpointId,
              "ui:options": {
                alreadySet: Boolean(propValue),
                isLegacy,
                prevPath: isLegacy ? propValue.slice(7) : propValue
              }
            };
          } else {
            return {};
          }
        })
      );
    });
  }, [setupTarget, setupUiJson, prevUserSettings]);

  return (
    <Card spacing noscroll>
      {showAdvanced || !wizardAvailable ? (
        <OldEditor
          userSettings={editorData}
          initialUserSettings={userSettings}
          onCancel={goBack}
          onChange={setEditorData}
          onSubmit={onOldEditorSubmit}
          onHideAdvancedEditor={onHideAdvancedEditor}
          canBeHidded={wizardAvailable}
        />
      ) : (
        <FormJsonSchema
          schema={setupSchemaFormated}
          uiSchema={setupUiJsonFormated}
          formData={wizardData}
          // onChange={() => {}}
          onSubmit={onWizardSubmit}
          onShowAdvancedEditor={onShowAdvancedEditor}
          onCancel={goBack}
          onSubmitLabel="Submit"
          onCancelLabel="Back"
        />
      )}
      {dataErrors.length > 0 && (
        <Alert variant="danger" style={{ marginBottom: 0 }}>
          {dataErrors.map(error => (
            <div key={error}>{error}</div>
          ))}
        </Alert>
      )}
    </Card>
  );
};

export default SetupWizard;
