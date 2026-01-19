import * as React from "react";
import Box from "@mui/joy/Box";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import Typography from "@mui/joy/Typography";
import CircularProgress from "@mui/joy/CircularProgress";
import Stack from "@mui/joy/Stack";
import { API_URL } from "../api_url";

export type HierarchyView = {
  gxp_code: string;
  substation_name: string | null;
  hv_feeder_code: string | null;
  dtx_code: string | null;
};

async function fetchValues(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.values)) return data.values;
  return [];
}

interface HierarchyProps {
  onSelectionChange?: (hierarchy_view: HierarchyView | null) => void;
  selectedName?: string | null;
}

interface HierarchyNodeProps {
  label: string;
  levelLabel: string;
  fetchChildren?: () => Promise<string[]>;
  renderChild?: (child: string) => React.ReactNode;
  onSelect?: (name: string) => void;
  selectedName?: string | null;
}

function HierarchyNode({
  label,
  levelLabel,
  fetchChildren,
  renderChild,
  onSelect,
  selectedName,
}: HierarchyNodeProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [children, setChildren] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isSelected = selectedName === label;

  const loadChildren = React.useCallback(async () => {
    if (!fetchChildren) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await fetchChildren();
      setChildren(loaded);
    } catch (err: any) {
      setError(err?.message ?? "Unable to load children");
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [fetchChildren]);

  const handleToggle = () => {
    if (!fetchChildren) return;
    if (!expanded && children === null && !loading) {
      loadChildren();
    }
    setExpanded((prev) => !prev);
  };

  const handleSelect = () => {
    onSelect?.(label);
  };

  return (
    <>
      <ListItem nested={Boolean(fetchChildren)} sx={{ p: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: 1,
          }}
        >
          {fetchChildren && (
            <Typography
              level="body-sm"
              onClick={handleToggle}
              sx={{
                width: 16,
                textAlign: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {expanded ? "▾" : "▸"}
            </Typography>
          )}
          {!fetchChildren && (
            <Box sx={{ width: 16, height: 16, flexShrink: 0 }} />
          )}
          <ListItemButton
            onClick={handleSelect}
            selected={isSelected}
            sx={{
              flex: 1,
              borderRadius: "sm",
              "&.Mui-selected": { backgroundColor: "primary.softBg" },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography level="body-md">{label}</Typography>
              <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                {levelLabel}
              </Typography>
            </Stack>
          </ListItemButton>
        </Box>
      </ListItem>

      {expanded && fetchChildren && (
        <List
          size="sm"
          sx={{
            pl: 3,
            gap: 0.5,
            borderLeft: "1px solid",
            borderColor: "divider",
          }}
        >
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
              <CircularProgress size="sm" />
              <Typography level="body-sm">Loading…</Typography>
            </Box>
          )}
          {error && (
            <Typography level="body-sm" color="danger" sx={{ pl: 1 }}>
              {error}
            </Typography>
          )}
          {!loading && !error && (children?.length ?? 0) === 0 && (
            <Typography level="body-sm" sx={{ pl: 1, color: "text.tertiary" }}>
              No items
            </Typography>
          )}
          {!loading &&
            !error &&
            children?.map((child) =>
              renderChild ? (
                renderChild(child)
              ) : (
                <ListItem key={child} sx={{ p: 0 }}>
                  <ListItemButton
                    onClick={() => onSelect?.(child)}
                    selected={selectedName === child}
                    sx={{ borderRadius: "sm" }}
                  >
                    <Typography level="body-md">{child}</Typography>
                  </ListItemButton>
                </ListItem>
              )
            )}
        </List>
      )}
    </>
  );
}

export default function Hierarchy({
  onSelectionChange,
  selectedName,
}: HierarchyProps) {
  const [gxps, setGxps] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadGxps = async () => {
      try {
        const values = await fetchValues(`${API_URL}hierarchy`);
        setGxps(values);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load hierarchy");
      } finally {
        setLoading(false);
      }
    };

    loadGxps();
  }, []);

  const handleSelect = React.useCallback(
    (hierarchy_view: HierarchyView | null) => {
      onSelectionChange?.(hierarchy_view);
    },
    [onSelectionChange]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography level="title-md">Hierarchy</Typography>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size="sm" />
          <Typography level="body-sm">Loading hierarchy…</Typography>
        </Box>
      )}

      {error && (
        <Typography level="body-sm" color="danger">
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <List
          size="sm"
          variant="outlined"
          sx={{
            borderRadius: "sm",
            maxHeight: "60vh",
            overflow: "auto",
            p: 0.5,
            gap: 0.5,
          }}
        >
          {gxps.map((gxp) => (
            <HierarchyNode
              key={gxp}
              label={gxp}
              levelLabel="GXP"
              selectedName={selectedName}
              onSelect={(name) =>
                handleSelect({
                  gxp_code: gxp,
                  substation_name: null,
                  hv_feeder_code: null,
                  dtx_code: null,
                })
              }
              fetchChildren={() =>
                fetchValues(
                  `${API_URL}hierarchy?gxp=${encodeURIComponent(gxp)}`
                )
              }
              renderChild={(substation) => (
                <HierarchyNode
                  key={`${gxp}-${substation}`}
                  label={substation}
                  levelLabel="Substation"
                  selectedName={selectedName}
                  onSelect={(name) =>
                    handleSelect({
                      gxp_code: gxp,
                      substation_name: substation,
                      hv_feeder_code: null,
                      dtx_code: null,
                    })
                  }
                  fetchChildren={() =>
                    fetchValues(
                      `${API_URL}hierarchy?gxp=${encodeURIComponent(
                        gxp
                      )}&substation=${encodeURIComponent(substation)}`
                    )
                  }
                  renderChild={(hv_feeder) => (
                    <HierarchyNode
                      key={`${gxp}-${substation}-${hv_feeder}`}
                      label={hv_feeder}
                      levelLabel="HV Feeder"
                      selectedName={selectedName}
                      onSelect={(name) =>
                        handleSelect({
                          gxp_code: gxp,
                          substation_name: substation,
                          hv_feeder_code: hv_feeder,
                          dtx_code: null,
                        })
                      }
                      fetchChildren={() =>
                        fetchValues(
                          `${API_URL}hierarchy?gxp=${encodeURIComponent(
                            gxp
                          )}&substation=${encodeURIComponent(
                            substation
                          )}&hv=${encodeURIComponent(hv_feeder)}`
                        )
                      }
                      renderChild={(dtx) => (
                        <HierarchyNode
                          key={`${gxp}-${substation}-${hv_feeder}-${dtx}`}
                          label={dtx}
                          levelLabel="DTX"
                          selectedName={selectedName}
                          onSelect={(name) =>
                            handleSelect({
                              gxp_code: gxp,
                              substation_name: substation,
                              hv_feeder_code: hv_feeder,
                              dtx_code: dtx,
                            })
                          }
                        />
                      )}
                    />
                  )}
                />
              )}
            />
          ))}
        </List>
      )}
    </Box>
  );
}
