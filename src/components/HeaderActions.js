import React from "react";
import Card from "react-bootstrap/Card";
import Accordion from "react-bootstrap/Accordion";
import ConnectForm from "./ConnectForm";
import SubscribeForm from "./SubscribeForm";
import PublishForm from "./PublishForm";

// onFormSubmit={this.onFormSubmit}
// isConnected={this.state.isConnected}
// options={this.state.options}
// eslint-disable-next-line
function FormCard(props) {
  return (
    <Card>
      <Accordion.Toggle as={Card.Header} className="bg-dark" eventKey={props.index}>
        <span className="text-white">{props.title}</span>
      </Accordion.Toggle>
      <Accordion.Collapse eventKey={props.index}>
        <Card.Body>{props.children}</Card.Body>
      </Accordion.Collapse>
    </Card>
  );
}

export default (props) => {
  return (
    <Accordion defaultActiveKey="0" className="w-100">
      {/* Connect Form Card */}
      <Card>
        <Accordion.Toggle as={Card.Header} className="bg-primary" eventKey="0">
          <span className="text-white"> Conección </span>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="0">
          <Card.Body>
            <ConnectForm onConnectFormSubmit={props.onConnectFormSubmit} />
          </Card.Body>
        </Accordion.Collapse>
      </Card>
      {/* Subscribe Form Card */}
      <Card>
        <Accordion.Toggle as={Card.Header} className="bg-primary" eventKey="1">
          <span className="text-white"> Suscripción</span>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="1">
          <Card.Body>
            <SubscribeForm onSubscribeFormSubmit={props.onSubscribeFormSubmit} />
          </Card.Body>
        </Accordion.Collapse>
      </Card>
      {/* Publish Form Card */}
      <Card>
        <Accordion.Toggle as={Card.Header} className="bg-primary" eventKey="2">
          <span className="text-white"> Publicar</span>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey="2">
          <Card.Body>
            <PublishForm onPublishFormSubmit={props.onPublishFormSubmit} />
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
};
