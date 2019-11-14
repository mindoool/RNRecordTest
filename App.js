/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Platform,
  TouchableHighlight,
} from 'react-native';

import Sound from 'react-native-sound';
import {AudioRecorder, AudioUtils} from 'react-native-audio';

const App: () => React$Node = () => {
  const [currentTime, setCurrentTime] = React.useState(0.0);
  const [recording, setRecording] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [stoppedRecording, setStoppedRecording] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  const [audioPath, setAudiopath] = React.useState(
    `${AudioUtils.DocumentDirectoryPath}/test.aac`,
  );
  const [hasPermission, setHasPermission] = React.useState();

  function prepareRecordingPath(audioPath) {
    AudioRecorder.prepareRecordingAtPath(audioPath, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: 'Low',
      AudioEncoding: 'aac',
      AudioEncodingBitRate: 32000,
    });
  }

  function _finishRecording(didSucceed, filePath, fileSize) {
    setFinished(didSucceed);
    console.log(
      `Finished recording of duration ${currentTime} seconds at path: ${filePath} and size of ${fileSize ||
      0} bytes`,
    );
  }

  React.useEffect(() => {
    AudioRecorder.requestAuthorization().then(isAuthorized => {
      setHasPermission(isAuthorized);

      if (!isAuthorized) {
        return;
      }

      prepareRecordingPath(audioPath);

      AudioRecorder.onProgress = data => {
        setCurrentTime(Math.floor(data.currentTime));
      };

      AudioRecorder.onFinished = data => {
        // Android callback comes in the form of a promise instead.
        if (Platform.OS === 'ios') {
          _finishRecording(
            data.status === 'OK',
            data.audioFileURL,
            data.audioFileSize,
          );
        }
      };
    });
  }, []);

  async function _pause() {
    if (!recording) {
      console.log('not recording');
      return;
    }

    try {
      const filePath = await AudioRecorder.pauseRecording();
      setPaused(true);
    } catch (error) {
      console.error(error);
    }
  }

  async function _resume() {
    if (!paused) {
      console.warn('not paused');
      return;
    }

    try {
      await AudioRecorder.resumeRecording();
      setPaused(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function _stop() {
    if (!recording) {
      console.warn('not recording');
      return;
    }

    setStoppedRecording(true);
    setRecording(false);
    setPaused(false);

    try {
      const filePath = await AudioRecorder.stopRecording();

      if (Platform.OS === 'android') {
        _finishRecording(true, filePath);
      }
      return filePath;
    } catch (error) {
      console.error(error);
    }
  }

  async function _play() {
    if (recording) {
      await _stop();
    }

    // These timeouts are a hacky workaround for some issues with react-native-sound.
    // See https://github.com/zmxv/react-native-sound/issues/89.

    setTimeout(() => {
      const s = new Sound(audioPath, '', error => {
        if (error) {
          console.log('failed to load the sound', error);
        }
      });

      setTimeout(() => {
        s.play(success => {
          if (success) {
            console.log('successfully finished playing');
          } else {
            console.log('playback failed due to audio decoding errors');
          }
        });
      }, 100);
    }, 100);
  }

  async function _record() {
    if (recording) {
      console.warn('Already recording!');
      return;
    }

    if (!hasPermission) {
      console.warn('no permission granted!');
      return;
    }

    if (stoppedRecording) {
      prepareRecordingPath(audioPath);
    }

    setRecording(true);
    setPaused(false);

    try {
      const filePath = await AudioRecorder.startRecording();
    } catch (error) {
      console.error(error);
    }
  }

  function _renderButton(title, onPress, active) {
    let style = active ? styles.activeButtonText : styles.buttonText;

    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>{title}</Text>
      </TouchableHighlight>
    );
  }

  function _renderPauseButton(onPress, active) {
    let style = active ? styles.activeButtonText : styles.buttonText;
    let title = paused ? 'RESUME' : 'PAUSE';
    return (
      <TouchableHighlight style={styles.button} onPress={onPress}>
        <Text style={style}>{title}</Text>
      </TouchableHighlight>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.controls}>
          <Text style={{fontSize: 30, alignSelf: 'center', fontWeight: '600'}}>
            Recorder Sample
          </Text>
          {_renderButton(
            'RECORD',
            () => {
              _record();
            },
            recording,
          )}
          {_renderButton('PLAY', () => {
            _play();
          })}
          {_renderButton('STOP', () => {
            _stop();
          })}
          {/* {this._renderButton("PAUSE", () => {this._pause()} )} */}
          {_renderPauseButton(() => {
            paused ? _resume() : _pause();
          })}
          <Text style={styles.progressText}>{currentTime}s</Text>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b608a',
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    paddingTop: 50,
    fontSize: 50,
    color: '#fff',
  },
  button: {
    padding: 20,
  },
  disabledButtonText: {
    color: '#eee',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
  activeButtonText: {
    fontSize: 20,
    color: '#B81F00',
  },
});

export default App;
