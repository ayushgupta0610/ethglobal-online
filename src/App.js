// import logo from "./logo.svg";
import { useEffect } from "react";
import "./App.css";
import ReactSismo from "./components/ReactSismo";

function App() {

  useEffect(() => {
    // Update the document title using the browser API
    // window.ethereum?.on("accountsChanged", connectWallet);
  });

  return (
    <div className="App">
      <header className="App-header">
        <ReactSismo></ReactSismo>
      </header>
    </div>
  );
}

export default App;
