import React, { useState } from "react";
import PropTypes from "prop-types";
import { createStructuredSelector } from "reselect";
import { connect } from "react-redux";
import api from "API/rpcMethods";
import { confirm } from "components/ConfirmDialog";
import { encrypt } from "utils/publicKeyEncryption";
// Components
import Card from "components/Card";
import Button from "components/Button";
import Form from "react-bootstrap/Form";
import StatusIcon from "components/StatusIcon";
import Loading from "components/generic/Loading";
// External
import { getIdentityAddress } from "services/dappnodeStatus/selectors";
import { adminNaclSecretKey } from "params";
// Images
import etherCardSample from "img/ether-card-sample.png";
import blankCardSample from "img/blank-card-sample.png";
// Style
import "./identity.scss";

function Identity({ identityAddress }) {
  const [showRealCard, setShowRealCard] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [isOnProgress, setIsOnProgress] = useState(false);
  const [editorActive, setEditorActive] = useState(false);

  async function sendSeedPhrase() {
    try {
      setIsOnProgress(true);
      if (identityAddress)
        await new Promise(resolve =>
          confirm({
            title: `Changing DAppNode Identity`,
            text: `Are you sure you want to change the current DAppNode's identity?`,
            label: "Yes",
            onClick: resolve,
            variant: "danger"
          })
        );

      const dappmanagerPublicKey = await api.naclEncryptionGetPublicKey({}, {});
      const seedPhraseEncrypted = encrypt(
        seedPhrase,
        adminNaclSecretKey,
        dappmanagerPublicKey
      );
      await api.seedPhraseSet(
        { seedPhraseEncrypted },
        { toastMessage: `Setting seed phrase...` }
      );
    } catch (e) {
      console.error(`Error on sendSeedPhrase: ${e.stack}`);
    } finally {
      setIsOnProgress(false);
    }
  }

  const correctLength = (seedPhrase || "").trim().split(/\s+/).length === 12;
  const valid = seedPhrase && correctLength;

  return (
    <>
      {/* Hack until a less verbose version of caching api calls is implemented */}
      {identityAddress === null ? (
        <Loading msg="Checking identity..." />
      ) : identityAddress && !editorActive ? (
        <Card spacing>
          <StatusIcon
            success
            message={
              <>
                Identity set: <strong>{identityAddress}</strong>
              </>
            }
          />
          <Button onClick={() => setEditorActive(true)}>Edit</Button>
        </Card>
      ) : (
        <Card className="dappnode-identity">
          <div>
            <p>
              Introduce the mnemonic seed phrase of the account holding your
              DAppNode NFT.
            </p>
            <img
              className="ether-card-sample"
              src={showRealCard ? etherCardSample : blankCardSample}
              alt="ether.cards sample"
            />
            <div>
              <span
                className="card-sample-toggle"
                onClick={() => setShowRealCard(!showRealCard)}
              >
                Show a real ether.card sample
              </span>
            </div>
          </div>

          <div>
            <div className="subtle-header">
              Mnemonic seed phrase (12 words separated by spaces)
            </div>
            <Form.Control
              as="textarea"
              rows="3"
              placeholder="word1 word2..."
              value={seedPhrase}
              onChange={e => setSeedPhrase(e.target.value)}
            />
          </div>

          <div>
            <Button
              onClick={sendSeedPhrase}
              disabled={isOnProgress || !valid}
              style={{ marginRight: "1rem" }}
              variant="dappnode"
            >
              Set identity
            </Button>
            {identityAddress && (
              <Button onClick={() => setEditorActive(false)}>Cancel</Button>
            )}
          </div>
        </Card>
      )}
    </>
  );
}

Identity.propTypes = {
  identityAddress: PropTypes.string.isRequired
};

// Container

const mapStateToProps = createStructuredSelector({
  identityAddress: getIdentityAddress
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Identity);
