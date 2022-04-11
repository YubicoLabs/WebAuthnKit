import React, { useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const styles = require("../component.module.css");

/**
 * Acts as a display prompt to provide custom instructions on how your users should handle the
 * registration of their security keys
 */
const AddTrustedDeviceGuidance = function ({ PLAT_AUTH }) {
  const { t } = useTranslation();

  const [steps, setSteps] = useState([]);

  const mapSteps = () => {
    const stringBuilder = `add-trusted-device-guidance.steps.${PLAT_AUTH.id}`;
    const stepTemp = [];
    stepTemp.push(t("add-trusted-device-guidance.steps.step-0"));
    stepTemp.push(t("add-trusted-device-guidance.steps.step-1"));
    const platSteps = t(stringBuilder, {
      returnObjects: true,
    });

    setSteps(stepTemp.concat(platSteps));
  };

  useEffect(() => {
    mapSteps();
  }, []);

  return (
    <Card className={styles.default["cardSpacing"]}>
      <Card.Img
        variant="top"
        src="https://www.yubico.com/wp-content/uploads/2021/01/illus-fingerprint-r1-dk-teal-1.svg"
        className={styles.default["addCredIcon"]}
      />
      <Card.Header>
        <h5>{t("add-trusted-device-guidance.header")}</h5>
      </Card.Header>
      <Card.Body>
        <p>{t("add-trusted-device-guidance.overview")}</p>
        <ol>
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        <p>
          {t("add-trusted-device-guidance.conclusion", {
            PLAT_AUTH: PLAT_AUTH.platName,
          })}
        </p>
      </Card.Body>
    </Card>
  );
};
export default AddTrustedDeviceGuidance;
