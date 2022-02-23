import React from "react";
import { t } from "ttag";
import Radio from "metabase/core/components/Radio";
import { EntityViewSwitchRoot } from "./EntityViewSwitch.styled";

type EntityView = "group" | "database";

interface EntityViewSwitchProps {
  value: EntityView;
  onChange: (value: EntityView) => void;
}

export const EntityViewSwitch = ({
  value,
  onChange,
}: EntityViewSwitchProps) => (
  <EntityViewSwitchRoot>
    <Radio
      variant="bubble"
      colorScheme="accent7"
      options={[
        {
          name: t`Groups`,
          value: "group",
        },
        {
          name: t`Databases`,
          value: "database",
        },
      ]}
      value={value}
      onChange={onChange as any}
    />
  </EntityViewSwitchRoot>
);
