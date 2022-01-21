import React from "react";
import Button from "react-bootstrap/Button";
import { CopyToClipboard } from "react-copy-to-clipboard";

export const TopicInfo = ({ topics, onTopicClick }) => {
  const handleClick = (e) => {
    onTopicClick && onTopicClick(e.target.textContent);
  };
  const tps = [...topics].map((text) => {
    return (
      <CopyToClipboard key={text} text={text}>
        <Button onClick={handleClick} variant="outline-success" className="mr-2" size="sm">
          {text}
        </Button>
      </CopyToClipboard>
    );
  });
  return (
    <p className="m-0 py-2">
      <strong>Estas suscrito a los tópicos: </strong>
      {tps}
    </p>
  );
};

export const SimpleInfo = ({ name, value }) => {
  return (
    <p className="m-0 p-0">
      <strong>{name}</strong>
      <span className="text-success">{value}</span>
    </p>
  );
};