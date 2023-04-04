var jsPsychCustomMusicmusic = (
  function (jspsych) {
    'use strict';

    const info = {
      name: "custom-musicmusic",
      parameters: {
        audio: {
          type: jspsych.ParameterType.AUDIO,
          default: undefined,
        },
        audio2: {
          type: jspsych.ParameterType.AUDIO,
          default: undefined,
        },
        audio3: {
          type: jspsych.ParameterType.AUDIO,
          default: undefined,
        },
        prompt: {
          type: jspsych.ParameterType.HTML_STRING,
          default: null,
        },
      },
    };
    /**
    * A custom plugin
    *
    * @author Kesong Cao
    */
    class CustomColorboardPlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {
        const stage_width = 800;
        const stage_height = 800;
        const indiv_length = 80;
        const indiv_space = indiv_length / 4;

        var event_status = "initial";
        var hidden = [];
        var click_count = 0;

        const css = window.document.styleSheets[0];
        css.insertRule(`
      @keyframes borderBlink {
          from, to {
              border-color: transparent
          }
          50% {
              border-color: black
          }
      }   `, css.cssRules.length);

        // show prompt if there is one
        if (trial.prompt !== null) {
          display_element.innerHTML = trial.prompt;
        }

        display_element.insertAdjacentHTML("beforeend", `
        <div id="container">
        <button id="audio1" style="cursor: not-allowed;"; disabled> <img src="volume-icon.png" style="height:200px; width:200px"/> </button>
          <br />
          <br />
          <br />
          <div style="display:flex;flex-direction:row; width: 600px; justify-content: space-between;">
            <button id="audio2" style="cursor: not-allowed"; disabled > <img src="volume-icon.png" style="height:200px; width:200px"/> </button>
            <button id="audio3" style="cursor: not-allowed"; disabled> <img src="volume-icon.png" style="height:200px; width:200px"/> </button>
          </div>

        </div>
        `);

        var end_trial = (response) => {
          // data saving
          var trial_data = {
            response: response,
            // rt: "NOT IMPLEMENTED",
            rt: -1,
          };
          // end trial
          display_element.innerHTML = "";
          this.jsPsych.finishTrial(trial_data);
        }

        // a dirty hack to avoid DOM not loaded yet
        setTimeout(() => {
          document.getElementById("audio2").addEventListener("click", () => end_trial("like"));
          document.getElementById("audio3").addEventListener("click", () => end_trial("dislike"));
        }, 2000);

        // play audio
        // console.log("trial.audio", trial.audio);
        // console.log("trial.audio2", trial.audio2);
        // console.log("trial.audio3", trial.audio3);
        var context = this.jsPsych.pluginAPI.audioContext();
        Promise.all([
          this.jsPsych.pluginAPI.getAudioBuffer(`${trial.audio}`),
          this.jsPsych.pluginAPI.getAudioBuffer(`${trial.audio2}`),
          this.jsPsych.pluginAPI.getAudioBuffer(`${trial.audio3}`),
        ]).then((buffers) => {
          // console.log("res", buffers);
          this.audio = context.createBufferSource();
          this.audio.buffer = buffers[0];
          this.audio.connect(context.destination);
          console.log('play audio 1');
          this.audio.start();
          var default_border_style = document.getElementById("audio1").style.border;
          document.getElementById("audio1").style.border = "20px solid black";
          document.getElementById("audio1").style.animation = "borderBlink 1s step-end infinite";


          setTimeout(() => {
            document.getElementById("audio1").style.border = default_border_style;
            document.getElementById("audio1").style.animation = "none";
            this.audio.stop();
            this.audio = context.createBufferSource();
            this.audio.buffer = buffers[1];
            this.audio.connect(context.destination);
            console.log('play audio 2');
            this.audio.start();
            document.getElementById("audio2").style.border = "20px solid black";
            document.getElementById("audio2").style.animation = "borderBlink 1s step-end infinite";


            setTimeout(() => {
              document.getElementById("audio2").style.border = default_border_style;
              document.getElementById("audio2").style.animation = "none";
              this.audio.stop();
              this.audio = context.createBufferSource();
              this.audio.buffer = buffers[2];
              this.audio.connect(context.destination);
              console.log('play audio 3');
              this.audio.start();
              document.getElementById("audio3").style.border = "20px solid black";
              document.getElementById("audio3").style.animation = "borderBlink 1s step-end infinite";


              setTimeout(() => {
                document.getElementById("audio3").style.border = default_border_style;
                document.getElementById("audio3").style.animation = "none";

                document.getElementById("audio2").disabled = false;
                document.getElementById("audio3").disabled = false;

                document.getElementById("audio2").style.cursor = 'pointer';
                document.getElementById("audio3").style.cursor = 'pointer';

              }, (buffers[2].duration) * 1000);
            },
              (buffers[1].duration) * 1000
            );

          },
            (buffers[0].duration) * 1000
          );




        })
          .catch(function (err) {
            console.error('Audio file failed to load')
            console.error('err', err);
            ;
          });







      }



      // private methods
      xyY2XYZ(x, y, Y) {
        var X = (x / y) * Y;
        var Z = ((1 - x - y) / y) * Y;
        return [X / 100., Y / 100., Z / 100.];
      }
    }
    CustomColorboardPlugin.info = info;

    return CustomColorboardPlugin;

  })(jsPsychModule);
