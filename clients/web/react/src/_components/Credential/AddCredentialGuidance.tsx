import React from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const styles = require("../component.module.css");

/**
 * Acts as a display prompt to provide custom instructions on how your users should handle the
 * registration of their security keys
 */
const AddCredentialGuidance = function () {
  const { t } = useTranslation();

  return (
    <Card className={styles.default["cardSpacing"]}>
      <Card.Img
        variant="top"
        src="https://developers.yubico.com/css/illus-yubikey-r2-green.svg"
        className={styles.default["addCredIcon"]}
      />
      <Card.Header>
        <h5>{t("add-credential-guidance.header")}</h5>
      </Card.Header>
      <Card.Body>
        <p>{t("add-credential-guidance.overview")}</p>
        <ol>
          <li>{t("add-credential-guidance.steps.step-0-a")}</li>
          <li>{t("add-credential-guidance.steps.step-0-b")}</li>
          <li>{t("add-credential-guidance.steps.step-1")}</li>
          <li>{t("add-credential-guidance.steps.step-2")}</li>
          <li>{t("add-credential-guidance.steps.step-3")}</li>
          <li>{t("add-credential-guidance.steps.step-4")}</li>
          <li>{t("add-credential-guidance.steps.step-5")}</li>
        </ol>
        <p>{t("add-credential-guidance.conclusion")}</p>
      </Card.Body>
    </Card>
  );
};
export default AddCredentialGuidance;
