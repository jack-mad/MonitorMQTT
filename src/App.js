import React from "react";
import mqtt from "mqtt";
import * as store from "./utils/store";
import { isIterable, isString, toastInfo, toastError, toastSuccess } from "./utils/utils";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import moment from "moment";
import AppContext from "./context/AppContext";
import MessageList from "./components/MessageList";
import HeaderActions from "./components/HeaderActions";
import Button from "react-bootstrap/Button";

const MQTT_OPTIONS = {
  host: "ws://test.mosquitto.org:8080",
  username: null,
  password: null
};

const DEFAULT_TOPICS = new Set(["ColosioM", "HeronRamirezM", "device/#"]);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const options = store.storeGet("options") || MQTT_OPTIONS;
    this.state = {
      isConnected: false,
      needReconnect: true,
      options: options,
      topics: new Set(),
      messages: []
    };
  }

  render() {
    const { messages, isConnected } = this.state;
    const showClearButton = messages && messages.length > 0;
    const clsNames = isConnected ? "p-2 text-primary" : "p-2 text-secondary";
    return (
      <AppContext.Provider value={this.state}>
        <Container>
          <Row className="justify-content-center">
            <h2 className={clsNames} as={Col}>
              Monitor MQTT IngenIO
            </h2>
          </Row>
          <Row>
            <HeaderActions
              onConnectFormSubmit={this.onConnectFormSubmit}
              onSubscribeFormSubmit={this.onSubscribeFormSubmit}
              onPublishFormSubmit={this.onPublishFormSubmit}
            />
          </Row>
          <Row className="m-3">
            <h4 as={Col}>Mensajes Recibidos</h4>
          </Row>
          <Row>
            <MessageList />
          </Row>
          <Row className="justify-content-end p-3">
            {showClearButton ? (
              <Button
                as={Col}
                md={3}
                lg={2}
                onClick={this.onClearClick}
                variant="outline-dark"
              >
                Limpiar bandeja
              </Button>
            ) : null}
          </Row>
        </Container>
      </AppContext.Provider>
    );
  }

  onClearClick = () => {
    this.setState({ messages: [] });
  };

  onConnectFormSubmit = options => {
    console.log("onConnectFormSubmit ", options);
    if (this.state.isConnected) {
      this.client.end();
    } else {
      if (options && options.host) {
        this.connect(options);
        // this.setState({ options: options }, () => {
        //   this.checkConnect();
        // });
      }
    }
  };

  onSubscribeFormSubmit = options => {
    console.log("onSubscribeFormSubmit ", options);
    const { subscribe, topics } = options;
    if (this.state.isConnected && topics) {
      const theTopics = topics.split(" ");
      if (subscribe) {
        this.subscribe(theTopics);
      } else {
        this.unsubscribe(theTopics);
      }
    }
  };

  onPublishFormSubmit = options => {
    console.log("onPublishFormFormSubmit ", options);
    const { topic, message } = options;
    if (topic.includes("#") || topic.includes("*")) {
      toastError("T??pico inv??lido", "No puedes publicar en t??picos de Wildcard");
      return;
    }
    if (this.state.isConnected && topic && message) {
      this.publish(topic, message, options.callback);
    }
  };

  cleanTopics(inTopics) {
    let topics;
    if (isString(inTopics)) {
      topics = inTopics.split(" ");
    } else if (isIterable(inTopics)) {
      topics = inTopics;
    } else {
      topics = inTopics;
    }
    return [...topics].map(it => it.trim()).filter(Boolean);
  }

  publish(topic, message, callback) {
    console.log("Publicando en: ", topic,":", message);
    this.client.publish(topic, message, err => {
      if (!err) {
        console.log("Publicado en: ", topic,":", message);
        toastSuccess("Mensaje enviado", "Mensaje enviado al t??pico " + topic);
      } else {
        console.log("Error publicando:", err);
      }
      callback && callback(err);
    });
  }

  unsubscribe(inTopics, callback) {
    const topics = this.cleanTopics(inTopics);
    console.log("Cancelar suscripci??n a:", topics);
    this.client.unsubscribe(topics, err => {
      if (!err) {
        console.log("Suscripci??n cancelada", topics);
        const newTopics = this.state.topics;
        topics.forEach(el => {
          newTopics.delete(el);
        });
        this.setState({ topics: newTopics });
      } else {
        console.error("Error cancelando suscripci??n:", err);
      }
      callback && callback(err);
    });
  }

  subscribe(inTopics, callback) {
    const topics = this.cleanTopics(inTopics);
    console.log("Suscribirse a:", topics);
    this.client.subscribe(topics, null, (err, granted) => {
      if (!err) {
        console.log("Suscrito a:", granted);
        this.setState({ topics: new Set([...topics, ...this.state.topics]) });
        toastSuccess("Suscripcion exitosa", "Suscrito al t??pico: " + topics);
      } else {
        console.error("Error suscribiendo:", err);
        toastError("Error suscribiendo", err);
      }
      callback && callback(err, granted);
    });
  }

  disconnect() {
    this.state.isConnected &&
      this.client.end(() => {
        console.log("Desconectar");
      });
  }

  onConnected(opts) {
    console.log("Conectado a:", opts);
    toastSuccess("MQTT Conectado!", "Conectado a: " + opts.host);
    store.storeSet("options", opts);
    this.setState(
      {
        isConnected: this.client.connected,
        options: opts,
        messages: []
      },
      () => {
        let topics;
        if (this.state.topics && this.state.topics.length > 0) {
          topics = this.state.topics;
        } else {
          topics = DEFAULT_TOPICS;
        }
        this.subscribe(topics, err => {
          if (!err) {
            const now = moment().format("YYYY-MM-DD HH:mm:ss");
            this.client.publish("device/online", `Monitor MQTT IngenIO en linea a las ${now}!`);
          }
        });
      }
    );
  }

  connect(opts) {
    let dateStr = new Date().toJSON().slice(0, 10).replaceAll('-', '');
    const connectOpts = { ...opts, reconnectPeriod: 120 * 1000, clientId: 'WebMQTT-IO-' + dateStr };
    console.log("Conectando con:", connectOpts);
    this.client = mqtt.connect(opts.host, connectOpts);
    this.client.on("connect", () => {
      this.onConnected(connectOpts);
    });
    this.client.on("disconnect", () => {
      console.log("Desconectando");
      this.setState({ isConnected: this.client.connected });
      toastError(
        "Conexi??n perdida!",
        "Perdimos conexi??n de " + connectOpts.host
      );
    });
    this.client.on("reconnect", () => {
      console.log("Reconectando");
    });
    this.client.on("offline", () => {
      console.log("Fuera de linea");
    });
    this.client.on("close", () => {
      console.log("Conexion terminada");
      toastInfo(
        "Conexi??n Terminada",
        "Terminaste la conexion de: " + connectOpts.host
      );
      this.setState({ isConnected: this.client.connected });
    });
    this.client.on("error", err => {
      console.log("Ooops", "Algo salio mal : ", err);
      this.setState({ isConnected: this.client.connected });
    });
    this.client.stream.on("error", err => {
      console.error("Error de conexi??n: ", err);
      toastError(
        "Error de conexi??n!",
        "No pudimos conectarnos a : " + connectOpts.host
      );
    });
    this.client.on("message", (topic, message) => {
         toastSuccess("Mensaje:", message.toString() + " en " + topic ); // Quitar para privacidad
      this.setState({
        messages: [
          {
            ts: Math.round(Date.now() / 1000),
            topic: topic,
            message: message.toString()
          },
          ...this.state.messages
        ]
      });
    });
  }

  checkConnect() {
    const options = this.state.options;
    options.host && options.host.startsWith("ws") && this.connect(options);
  }

  componentDidMount() {
    console.log("componentDidMount", this.state.options);
  }

  componentWillUnmount() {
    console.log("componentWillUnmount");
    if (this.state.isConnected) {
      store.storeSet("options", this.state.options);
    }
    // store.saveMessages(this.state.options.host, this.state.messages);
  }
}
