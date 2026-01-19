import * as React from "react";
import AccordionGroup from "@mui/joy/AccordionGroup";

import LazyAccordion from "./lazy_accordion_component";

export default function Hierarchy() {
  const [gxps, setGxps] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch(`http://127.0.0.1:5000/api/hierarchy`)
      .then((response) => response.json())
      .then((data) => {
        setGxps(data["values"]);
      })
      .catch((err) => console.error(`Unable to get GXP hierarchy ${err}`));
  }, []);

  return (
    <AccordionGroup>
      {gxps.map((gxp) => (
        <LazyAccordion
          key={gxp}
          title={gxp}
          fetchChildren={() =>
            fetch(`http://127.0.0.1:5000/api/hierarchy?gxp=${gxp}`).then((r) =>
              r.json()
            )
          }
          renderChild={
            <LazyAccordion
              title={gxp}
              fetchChildren={() =>
                fetch(`http://127.0.0.1:5000/api/hierarchy?gxp=${gxp}`).then(
                  (r) => r.json()
                )
              }
              renderChild={(sub) => (
                <LazyAccordion
                  title={sub}
                  fetchChildren={() =>
                    fetch(`/api/substations/${sub}/hvfeeders`).then((r) =>
                      r.json()
                    )
                  }
                  renderChild={(hv) => (
                    <LazyAccordion
                      title={hv}
                      fetchChildren={() =>
                        fetch(`/api/hvfeeders/${hv}/dtxs`).then((r) => r.json())
                      }
                      renderChild={(dtx) => (
                        <Typography level="body-sm" sx={{ pl: 2 }}>
                          {dtx}
                        </Typography>
                      )}
                    />
                  )}
                />
              )}
            />
          }
        />
      ))}
    </AccordionGroup>
  );
}
