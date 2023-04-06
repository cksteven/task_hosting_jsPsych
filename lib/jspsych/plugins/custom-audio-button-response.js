var jsPsychCustomAudioButtonResponse = (function (jspsych) {
  'use strict';


  const info = {
    name: "custom-audio-button-response",
    parameters: {
      labels_mul: {
        type: jspsych.ParameterType.OBJECT,
        default: null,
        array: true,
      },
      /** The audio to be played. */
      stimulus: {
        type: jspsych.ParameterType.AUDIO,
        pretty_name: "Stimulus",
        default: undefined,
      },
      /** Array containing the label(s) for the button(s). */
      choices: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Choices",
        default: undefined,
        array: true,
      },
      /** The HTML for creating button. Can create own style. Use the "%choice%" string to indicate where the label from the choices parameter should be inserted. */
      button_html: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: "Button HTML",
        default: '<button class="jspsych-btn">%choice%</button>',
        array: true,
      },
      /** Any content here will be displayed below the stimulus. */
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: "Prompt",
        default: null,
      },
      /** The maximum duration to wait for a response. */
      trial_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Trial duration",
        default: null,
      },
      /** Vertical margin of button. */
      margin_vertical: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Margin vertical",
        default: "0px",
      },
      /** Horizontal margin of button. */
      margin_horizontal: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Margin horizontal",
        default: "8px",
      },
      /** If true, the trial will end when user makes a response. */
      response_ends_trial: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Response ends trial",
        default: true,
      },
      /** If true, then the trial will end as soon as the audio file finishes playing. */
      trial_ends_after_audio: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Trial ends after audio",
        default: false,
      },
      /**
       * If true, then responses are allowed while the audio is playing.
       * If false, then the audio must finish playing before a response is accepted.
       */
      response_allowed_while_playing: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Response allowed while playing",
        default: true,
      },
    },
  };

  /**
   * **audio-slider-response**
   *
   * jsPsych plugin for playing audio and getting a slider response
   *
   * @author Josh de Leeuw
   * @see {@link https://www.jspsych.org/plugins/jspsych-audio-slider-response/ audio-slider-response plugin documentation on jspsych.org}
   */
  class AudioButtonResponsePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
      this.cur_idx = 0;
      this.labels_num = 0;
      this.rts = [];
      this.responses = [];
      this.buffer_duration = 0;
    }


    trial(display_element, trial, on_load) {
      // hold the .resolve() function from the Promise that ends the trial
      let trial_complete;
      // setup stimulus
      var context = this.jsPsych.pluginAPI.audioContext();
      // store response
      var response = {
        rt: null,
        button: null,
      };
      // record webaudio context start time
      var startTime;
      // load audio file
      this.jsPsych.pluginAPI
        .getAudioBuffer(trial.stimulus)
        .then((buffer) => {
          this.buffer_duration = buffer.duration;
          if (context !== null) {
            this.audio = context.createBufferSource();
            this.audio.buffer = buffer;
            this.audio.loop = true;
            this.audio.connect(context.destination);
          }
          else {
            this.audio = buffer;
            this.audio.loop = true;
            this.audio.currentTime = 0;
          }
          this.labels_num = trial.labels_mul.length;
          setupTrial();
        })
        .catch((err) => {
          console.error(`Failed to load audio file "${trial.stimulus}". Try checking the file path. We recommend using the preload plugin to load audio files.`);
          console.error(err);
        });
      const setupTrial = (labels_mul_idx = 0) => {
        // set up end event if trial needs it
        if (trial.trial_ends_after_audio) {
          this.audio.addEventListener("ended", end_trial);
        }
        // enable buttons after audio ends if necessary
        if (!trial.response_allowed_while_playing && !trial.trial_ends_after_audio) {
          this.audio.addEventListener("ended", enable_buttons);
        }
        //display buttons
        var buttons = [];
        if (Array.isArray(trial.button_html)) {
          if (trial.button_html.length == trial.choices.length) {
            buttons = trial.button_html;
          }
          else {
            console.error("Error in audio-button-response plugin. The length of the button_html array does not equal the length of the choices array");
          }
        }
        else {
          for (var i = 0; i < trial.choices.length; i++) {
            buttons.push(trial.button_html);
          }
        }
        var html = ``;
        html += `
        <button id="audio1" style="cursor: not-allowed;"; disabled>
          <img src="volume-icon.png" style="height:100px; width:100px"/>
        </button>`;
        html += '<div id="jspsych-audio-button-response-btngroup">';
        for (var i = 0; i < trial.choices.length; i++) {
          var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
          html +=
            '<div class="jspsych-audio-button-response-button" style="cursor: pointer; display: inline-block; margin:' +
            trial.margin_vertical +
            " " +
            trial.margin_horizontal +
            '" id="jspsych-audio-button-response-button-' +
            i +
            '" data-choice="' +
            i +
            '">' +
            str +
            "</div>";
        }
        html += "</div>";
        //show prompt if there is one
        if (trial.prompt !== null) {
          html += trial.prompt;
        }
        html += `
        <p> 1 = most ${trial.labels_mul[labels_mul_idx][0]} </p>
        <p> 7 = most ${trial.labels_mul[labels_mul_idx][1]} </p>
        `;
        display_element.innerHTML = html;
        if (labels_mul_idx == 0) {
          disable_buttons();
          setTimeout(() => {
            enable_buttons();
          }, this.buffer_duration * 1000);
        } else {
          enable_buttons();
        }
        // if (trial.response_allowed_while_playing) {
        //   enable_buttons();
        // }
        // else {
        //   disable_buttons();
        // }
        // start time
        startTime = performance.now();
        // start audio
        if (this.cur_idx == 0) {
          if (context !== null) {
            startTime = context.currentTime;
            this.audio.start(startTime);
          }
          else {
            this.audio.play();
          }
        }
        // end trial if time limit is set
        if (trial.trial_duration !== null) {
          this.jsPsych.pluginAPI.setTimeout(() => {
            end_trial();
          }, trial.trial_duration);
        }
        on_load();
      };
      // function to handle responses by the subject
      var after_response = (choice) => {
        console.log("after_response called", choice);
        // measure rt
        var endTime = performance.now();
        var rt = Math.round(endTime - startTime);
        if (context !== null) {
          endTime = context.currentTime;
          rt = Math.round((endTime - startTime) * 1000);
        }
        response.button = parseInt(choice);
        response.rt = rt;
        this.responses.push(response.button);
        this.rts.push(-1);
        // disable all the buttons after a response
        disable_buttons();
        if (trial.response_ends_trial) {
          end_trial();
        }
      }
      // function to end trial when it is time
      const end_trial = () => {
        // kill any remaining setTimeout handlers
        this.jsPsych.pluginAPI.clearAllTimeouts();
        this.audio.removeEventListener("ended", end_trial);
        this.audio.removeEventListener("ended", enable_buttons);
        // next trial
        if (this.cur_idx == this.labels_num - 1) {
          if (context !== null) {
            this.audio.stop();
          }
          else {
            this.audio.pause();
          }
          var trialdata = {
            rt: this.rts,
            response: this.responses,
          };
                  // clear the display
        display_element.innerHTML = "";
          this.jsPsych.finishTrial(trialdata);
          trial_complete();

        } else {
          this.cur_idx += 1;
          setupTrial(this.cur_idx);
        }

      };
      function button_response(e) {
        var choice = e.currentTarget.getAttribute("data-choice"); // don't use dataset for jsdom compatibility
        after_response(choice);
      }
      function disable_buttons() {
        var btns = document.querySelectorAll(".jspsych-audio-button-response-button");
        for (var i = 0; i < btns.length; i++) {
          var btn_el = btns[i].querySelector("button");
          if (btn_el) {
            btn_el.disabled = true;
          }
          btns[i].removeEventListener("click", button_response);
        }
      }
      function enable_buttons() {
        var btns = document.querySelectorAll(".jspsych-audio-button-response-button");
        for (var i = 0; i < btns.length; i++) {
          var btn_el = btns[i].querySelector("button");
          if (btn_el) {
            btn_el.disabled = false;
          }
          btns[i].addEventListener("click", button_response);
        }
      }
      return new Promise((resolve) => {
        trial_complete = resolve;
      });
    }

  }
  AudioButtonResponsePlugin.info = info;

  return AudioButtonResponsePlugin;

})(jsPsychModule);
