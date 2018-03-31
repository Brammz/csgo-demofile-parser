# CSGO Demo Parser

This is a Node.js project used for parsing CSGO demo-files to json-files.

It uses the [demofile](https://github.com/saul/demofile) library (under the [MIT license](https://github.com/saul/demofile/blob/master/LICENSE)) to parse demo-files.

The parser parses the replay-file and creates a json-file for each visualization.
Each json-file consists of timestamps at which the information was updated, followed by all the information that is needed to create the corresponding visualization.

## Context

This parser is used for my [csgo-demo-visualizer](https://github.com/Brammz/csgo-demo-visualizer) tool.
It is a seperate project because of issues when using [demofile](https://github.com/saul/demofile) in combination with [React](https://reactjs.org/).
