import React from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { createBrowserHistory } from 'history';
import HelloWorldList from './HelloWorldList';
import HelloWorldPage from './HelloWorldPage';

function App() {
  return (
    <Router history={createBrowserHistory()}>
      <Switch>
        <Route path={'/'} component={HelloWorldList} exact/>
        <Route path={'/hello-world/:index'} component={HelloWorldPage} exact/>
      </Switch>
    </Router>
  );
}

export default App;
