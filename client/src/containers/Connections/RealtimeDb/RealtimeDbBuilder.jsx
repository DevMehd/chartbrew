import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import {
  Button, Input, Spacer, Divider, Chip, Checkbox, Tooltip,
} from "@nextui-org/react";
import AceEditor from "react-ace";
import { toast } from "react-toastify";

import "ace-builds/src-min-noconflict/mode-json";
import "ace-builds/src-min-noconflict/theme-tomorrow";
import "ace-builds/src-min-noconflict/theme-one_dark";

import {
  CloseSquare, Delete, InfoCircle, Play
} from "react-iconly";
import {
  runDataRequest as runDataRequestAction,
} from "../../../actions/dataRequest";
import { changeTutorial as changeTutorialAction } from "../../../actions/tutorial";
import { getConnection as getConnectionAction } from "../../../actions/connection";
import Container from "../../../components/Container";
import Row from "../../../components/Row";
import Text from "../../../components/Text";
import useThemeDetector from "../../../modules/useThemeDetector";

/*
  The API Data Request builder
*/
function RealtimeDbBuilder(props) {
  const [firebaseRequest, setFirebaseRequest] = useState({
    route: "",
  });
  const [result, setResult] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [limitValue, setLimitValue] = useState(100);
  const [invalidateCache, setInvalidateCache] = useState(false);
  const [fullConnection, setFullConnection] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const isDark = useThemeDetector();

  const {
    dataRequest, match, onChangeRequest, runDataRequest,
    connection, onSave, changeTutorial, // eslint-disable-line
    getConnection, onDelete, responses,
  } = props;

  // on init effect
  useEffect(() => {
    if (dataRequest) {
      setFirebaseRequest(dataRequest);
      if (dataRequest?.configuration?.limitToLast) {
        setLimitValue(dataRequest.configuration.limitToLast);
      } else if (dataRequest?.configuration?.limitToFirst) {
        setLimitValue(dataRequest.configuration.limitToFirst);
      }
      // setTimeout(() => {
      //   changeTutorial("RealtimeDb");
      // }, 1000);
    }
  }, []);

  useEffect(() => {
    const newApiRequest = firebaseRequest;

    getConnection(match.params.projectId, connection.id)
      .then((data) => {
        setFullConnection(data);
        if (data && data.firebaseServiceAccount) {
          try {
            setProjectId(JSON.parse(data.firebaseServiceAccount).project_id);
          } catch (error) {
            //
          }
        }
      })
      .catch(() => {});

    onChangeRequest(newApiRequest);
  }, [firebaseRequest, connection]);

  useEffect(() => {
    if (responses && responses.length > 0) {
      const selectedResponse = responses.find((o) => o.id === dataRequest.id);
      if (selectedResponse?.data) {
        setResult(JSON.stringify(selectedResponse.data, null, 2));
      }
    }
  }, [responses]);

  const _onChangeRoute = (value) => {
    setFirebaseRequest({ ...firebaseRequest, route: value });
  };

  const _onTest = () => {
    setRequestLoading(true);
    setRequestSuccess(false);
    setRequestError(false);

    onSave(firebaseRequest).then(() => {
      const useCache = !invalidateCache;
      runDataRequest(match.params.projectId, match.params.chartId, dataRequest.id, useCache)
        .then(() => {
          setRequestLoading(false);
        })
        .catch((error) => {
          setRequestLoading(false);
          setRequestError(error);
          toast.error("The request failed. Please check your request 🕵️‍♂️");
          setResult(JSON.stringify(error, null, 2));
        });
    });
  };

  const _onChangeLimitValue = (value) => {
    setLimitValue(value);
    if (firebaseRequest.configuration && firebaseRequest.configuration.limitToLast) {
      setFirebaseRequest({
        ...firebaseRequest,
        configuration: {
          ...firebaseRequest.configuration,
          limitToLast: value,
        },
      });
    }

    if (firebaseRequest.configuration && firebaseRequest.configuration.limitToFirst) {
      setFirebaseRequest({
        ...firebaseRequest,
        configuration: {
          ...firebaseRequest.configuration,
          limitToFirst: value,
        },
      });
    }
  };

  const _onSavePressed = () => {
    setSaveLoading(true);
    onSave(firebaseRequest).then(() => {
      setSaveLoading(false);
    }).catch(() => {
      setSaveLoading(false);
    });
  };

  return (
    <div style={styles.container}>
      <div className="grid grid-cols-12">
        <div className="col-span-7 sm:col-span-12">
          <Container>
            <Row justify="space-between" align="center">
              <Text b size={"lg"}>{connection.name}</Text>
              <div>
                <Row>
                  <Button
                    color="primary"
                    auto
                    size="sm"
                    onClick={() => _onSavePressed()}
                    isLoading={saveLoading || requestLoading}
                    variant="flat"
                  >
                    {"Save"}
                  </Button>
                  <Spacer x={0.6} />
                  <Tooltip content="Delete this data request" placement="bottom" css={{ zIndex: 99999 }}>
                    <Button
                      color="danger"
                      isIconOnly
                      auto
                      size="sm"
                      variant="bordered"
                      onClick={() => onDelete()}
                    >
                      <Delete />
                    </Button>
                  </Tooltip>
                </Row>
              </div>
            </Row>
            <Spacer y={1} />
            <Row>
              <Divider />
            </Row>
            <Spacer y={1} />
            <Row className="RealtimeDb-route-tut">
              <Input
                value={fullConnection.connectionString || `https://${projectId || "<your_project>"}.firebaseio.com/`}
                fullWidth
                className={"pointer-events-none"}
              />
              <Spacer x={0.5} />
              <Input
                placeholder={"Enter the data path"}
                autoFocus
                value={firebaseRequest.route || ""}
                onChange={(e) => _onChangeRoute(e.target.value)}
                variant="bordered"
                fullWidth
                disableAnimation
              />
            </Row>
            {(requestSuccess || requestError) && (
              <>
                <Spacer y={1} />
                <Row>
                  {requestSuccess && (
                    <>
                      <Chip color="success">
                        {`${requestSuccess.statusCode} ${requestSuccess.statusText}`}
                      </Chip>
                      <Spacer x={0.5} />
                      <Chip>
                        {`Length: ${result ? JSON.parse(result).length : 0}`}
                      </Chip>
                    </>
                  )}
                  {requestError && (
                    <Chip color="danger">
                      {`${requestError.statusCode} ${requestError.statusText}`}
                    </Chip>
                  )}
                </Row>
              </>
            )}

            <Spacer y={1} />
            <Divider />
            <Spacer y={1} />

            <Row>
              <Text b>
                Order By
              </Text>
            </Row>
            <Spacer y={1} />
            <Row align="center">
              <Chip
                radius="sm"
                variant={"bordered"}
                color={!firebaseRequest.configuration || (firebaseRequest.configuration && firebaseRequest.configuration.orderBy !== "child") ? "netral" : "secondary"}
                onClick={() => (
                  setFirebaseRequest({
                    ...firebaseRequest,
                    configuration: {
                      ...firebaseRequest.configuration,
                      orderBy: "child"
                    }
                  })
                )}
              >
                {"Child key"}
              </Chip>
              <Spacer x={0.5} />
              <Chip
                radius="sm"
                variant="bordered"
                color={!firebaseRequest.configuration || (firebaseRequest.configuration && firebaseRequest.configuration.orderBy !== "key") ? "neutral" : "secondary"}
                onClick={() => (
                  setFirebaseRequest({
                    ...firebaseRequest,
                    configuration: {
                      ...firebaseRequest.configuration,
                      orderBy: "key",
                    }
                  })
                )}
              >
                {"Key"}
              </Chip>
              <Spacer x={0.2} />
              <Chip
                radius="sm"
                variant={"bordered"}
                color={!firebaseRequest.configuration || (firebaseRequest.configuration && firebaseRequest.configuration.orderBy !== "value") ? "bordered" : "secondary"}
                onClick={() => (
                  setFirebaseRequest({
                    ...firebaseRequest,
                    configuration: {
                      ...firebaseRequest.configuration,
                      orderBy: "value",
                    }
                  })
                )}
              >
                {"Value"}
              </Chip>
              {firebaseRequest.configuration && firebaseRequest.configuration.orderBy && (
                <>
                  <Spacer x={0.5} />
                  <Button
                    color="danger"
                    variant="bordered"
                    startContent={<CloseSquare size="small" />}
                    onClick={() => (
                      setFirebaseRequest({
                        ...firebaseRequest,
                        configuration: {
                          ...firebaseRequest.configuration,
                          orderBy: ""
                        }
                      })
                    )}
                    auto
                    size="xs"
                  >
                    {"Disable ordering"}
                  </Button>
                </>
              )}
            </Row>
            <Spacer y={1} />
            {firebaseRequest.configuration && firebaseRequest.configuration.orderBy === "child" && (
              <Row>
                <Input
                  placeholder="Enter a field to order by"
                  value={(firebaseRequest.configuration && firebaseRequest.configuration.key) || ""}
                  onChange={(e) => (
                    setFirebaseRequest({
                      ...firebaseRequest,
                      configuration: {
                        ...firebaseRequest.configuration,
                        key: e.target.value
                      }
                    })
                  )}
                  variant="bordered"
                  fullWidth
                />
              </Row>
            )}

            <Spacer y={1} />
            <Divider />
            <Spacer y={1} />

            <Row>
              <Text b>Limit results</Text>
            </Row>
            <Spacer y={1} />

            <Row align="center">
              <Chip
                radius="sm"
                variant={"bordered"}
                color={
                  !firebaseRequest.configuration
                  || (firebaseRequest.configuration && !firebaseRequest.configuration.limitToLast)
                    ? "netrual" : "secondary"
                }
                onClick={() => (
                  setFirebaseRequest({
                    ...firebaseRequest,
                    configuration: {
                      ...firebaseRequest.configuration,
                      limitToLast: limitValue,
                      limitToFirst: 0,
                    }
                  })
                )}
              >
                Limit to last
              </Chip>
              <Spacer x={0.5} />
              <Chip
                radius="sm"
                variant={"bordered"}
                color={
                  !firebaseRequest.configuration
                  || (firebaseRequest.configuration && !firebaseRequest.configuration.limitToFirst)
                    ? "neutral" : "secondary"
                }
                onClick={() => (
                  setFirebaseRequest({
                    ...firebaseRequest,
                    configuration: {
                      ...firebaseRequest.configuration,
                      limitToFirst: limitValue,
                      limitToLast: 0,
                    }
                  })
                )}
              >
                Limit to first
              </Chip>
              <Spacer x={0.5} />
              {firebaseRequest.configuration
                && (firebaseRequest.configuration.limitToLast
                  || firebaseRequest.configuration.limitToFirst)
                && (
                  <Button
                    startContent={<CloseSquare size="small" />}
                    onClick={() => (
                      setFirebaseRequest({
                        ...firebaseRequest,
                        configuration: {
                          ...firebaseRequest.configuration,
                          limitToFirst: "",
                          limitToLast: "",
                        }
                      })
                    )}
                    auto
                    variant="bordered"
                    color="danger"
                    size="xs"
                  >
                    Disable limit
                  </Button>
                )}
            </Row>
            <Spacer y={1} />
            <Row>
              <Input
                placeholder="How many records should return?"
                type="number"
                value={limitValue}
                onChange={(e) => e.target.value && _onChangeLimitValue(e.target.value)}
                disabled={
                  !firebaseRequest.configuration
                    || (
                      !firebaseRequest.configuration.limitToLast
                      && !firebaseRequest.configuration.limitToFirst
                    )
                }
                variant="bordered"
                fullWidth
              />
            </Row>
          </Container>
        </div>
        <div className="col-span-5 sm:col-span-12">
          <Container>
            <Row className="RealtimeDb-request-tut">
              <Button
                shadow
                endContent={<Play />}
                isLoading={requestLoading}
                onClick={() => _onTest()}
                className="w-full"
              >
                Make the request
              </Button>
            </Row>
            <Spacer y={1} />
            <Row align="center">
              <Checkbox
                isSelected={!invalidateCache}
                onChange={() => setInvalidateCache(!invalidateCache)}
                size="sm"
              >
                Use cache
              </Checkbox>
              <Spacer x={0.5} />
              <Tooltip
                content="Use cache to avoid hitting the Firebase API every time you request data. The cache will be cleared when you change any of the settings."
                className="min-w-[600px]"
              >
                <InfoCircle size="small" />
              </Tooltip>
            </Row>
            <Spacer y={1} />
            <Row align="center">
              <div className="w-full">
                <AceEditor
                  mode="json"
                  theme={isDark ? "one_dark" : "tomorrow"}
                  style={{ borderRadius: 10 }}
                  height="450px"
                  width="none"
                  value={result || ""}
                  name="resultEditor"
                  readOnly
                  editorProps={{ $blockScrolling: false }}
                  className="RealtimeDb-result-tut"
                />
              </div>
            </Row>
            <Spacer y={1} />
            <Row align="center">
              <InfoCircle size="small" />
              <Spacer x={0.5} />
              <Text small>
                {"This is a preview and it might not show all data in order to keep things fast in the UI."}
              </Text>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    flex: 1,
  },
};

RealtimeDbBuilder.defaultProps = {
  dataRequest: null,
};

RealtimeDbBuilder.propTypes = {
  connection: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  onChangeRequest: PropTypes.func.isRequired,
  runDataRequest: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  dataRequest: PropTypes.object,
  changeTutorial: PropTypes.func.isRequired,
  getConnection: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  responses: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => {
  return {
    responses: state.dataRequest.responses,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    runDataRequest: (projectId, chartId, drId, getCache) => {
      return dispatch(runDataRequestAction(projectId, chartId, drId, getCache));
    },
    changeTutorial: (tutorial) => dispatch(changeTutorialAction(tutorial)),
    getConnection: (projectId, connectionId) => (
      dispatch(getConnectionAction(projectId, connectionId))
    ),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RealtimeDbBuilder));
