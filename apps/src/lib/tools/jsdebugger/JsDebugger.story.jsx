import React from 'react';
import {Provider} from 'react-redux';
import {combineReducers, createStore} from 'redux';
import commonReducers from '../../../redux/commonReducers';
import {reducers as applabReducers} from '../../../applab/redux/applab';
import {setPageConstants} from '../../../redux/pageConstants';
import JsDebugger from './JsDebugger';

function createApplabStore() {
  return createStore(combineReducers({
    ...commonReducers,
    ...applabReducers,
  }));
}

export default storybook => {
  const storyTable = [];

  const storybookStyle = {
    position: 'relative',
    width: '100%',
  };

  storyTable.push(
    {
      name: 'empty',
      story: () => (
        <Provider store={createApplabStore()}>
          <JsDebugger
            style={storybookStyle}
          />
        </Provider>
      )
    });

  const withDebugConsoleStore = createApplabStore();
  withDebugConsoleStore.dispatch(setPageConstants({
    showDebugConsole: true,
  }));
  storyTable.push(
      {
        name: 'with only debug console',
        story: () => (
            <div style={{height: 200}}>
              <Provider store={withDebugConsoleStore}>
                <JsDebugger style={storybookStyle}/>
              </Provider>
            </div>
        )
      });

  const withDebugSliderStore = createApplabStore();
  withDebugSliderStore.dispatch(setPageConstants({
    showDebugConsole: true,
    showDebugSlider: true,
  }));
  storyTable.push(
      {
        name: 'with speed slider',
        story: () => (
            <Provider store={withDebugSliderStore}>
              <JsDebugger style={storybookStyle}/>
            </Provider>
        )
      });

  const withDebugButtonsStore = createApplabStore();
  withDebugButtonsStore.dispatch(setPageConstants({
    showDebugConsole: true,
    showDebugButtons: true,
  }));
  storyTable.push(
    {
      name: 'with debug buttons',
      story: () => (
        <Provider store={withDebugButtonsStore}>
          <JsDebugger style={storybookStyle}/>
        </Provider>
      )
    });

  const withDebugWatchStore = createApplabStore();
  withDebugWatchStore.dispatch(setPageConstants({
    showDebugConsole: true,
    showDebugWatch: true,
  }));
  storyTable.push(
      {
        name: 'with debug watch',
        story: () => (
            <Provider store={withDebugWatchStore}>
              <JsDebugger style={storybookStyle}/>
            </Provider>
        )
      });

  const showAllStore = createApplabStore();
  showAllStore.dispatch(setPageConstants({
    showDebugButtons: true,
    showDebugConsole: true,
    showDebugWatch: true,
    showDebugSlider: true
  }));
  storyTable.push(
    {
      name: 'connected to redux stores with everything enabled',
      story: () => (
        <Provider store={showAllStore}>
          <JsDebugger style={storybookStyle} debugWatch/>
        </Provider>
      )
    });

  storybook
    .storiesOf('JsDebugger', JsDebugger)
    .addStoryTable(storyTable);
};
