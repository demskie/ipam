import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { Main } from "./components/Main";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(<Main />, document.getElementById("root"));

serviceWorker.register();
