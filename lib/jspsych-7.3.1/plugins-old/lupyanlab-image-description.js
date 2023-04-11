/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-image-description'] = (function() {
  jsPsych.pluginAPI.registerPreload('lupyanlab-image-description', 'stimi', 'image');
  jsPsych.pluginAPI.registerPreload('lupyanlab-image-description', 'stim2', 'image');
  jsPsych.pluginAPI.registerPreload('lupyanlab-image-description', 'stim3', 'image');
  jsPsych.pluginAPI.registerPreload('lupyanlab-image-description', 'stim4', 'image');

  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-image-description',
    parameters: {
      stim1: {
        type: jsPsych.plugins.parameterType.IMAGE, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      stim2: {
        type: jsPsych.plugins.parameterType.IMAGE, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      stim3: {
        type: jsPsych.plugins.parameterType.IMAGE, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      stim4: {
        type: jsPsych.plugins.parameterType.IMAGE, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: undefined,
      },
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Trial progress text',
        default: null,
        description: 'Text to display below progress bar',
      },
      description: {
        type: jsPsych.plugins.parameterType.STRING,
        default: null,
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Click on the shape below that you think this description refers to:',
      },
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: 1000,
      },
      feedback_outline_color: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'orange',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /*html*/ `
          <style>

          </style>
          <h3>${trial.trial_progress_text}</h3>
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style=" margin:1.5em; border:thin solid; padding:0.5em; max-width:50em; ont-weight:bold;">
              ${trial.description}
            </div>
            <div style=" margin:1.5em;">
              ${trial.prompt}
            </div>
            <div style="display:flex; justify-content:space-around; width:100%; ">
              <img id="plugin-1" src="${trial.stim1}" style="cursor:pointer; border:solid; max-width:20%; "/>
              <img id="plugin-2" src="${trial.stim2}" style="cursor:pointer; border:solid; max-width:20%;  "/>
              <img id="plugin-3" src="${trial.stim3}" style="cursor:pointer; border:solid; max-width:20%;"/>
              <img id="plugin-4" src="${trial.stim4}" style="cursor:pointer; border:solid; max-width:20%; "/>
            </div>
          </div>
        `;

    let selected = false;
    const startTime = performance.now();
    function selectChoice(response, target) {
      if (!selected) {
        selected = true;
        const endTime = performance.now();
        const rt = endTime - startTime;
        target.style.outline = `thick ridge ${trial.feedback_outline_color}`;

        jsPsych.pluginAPI.setTimeout(function() {
          // data saving
          var trial_data = {
            response,
            rt,
          };

          // end trial
          jsPsych.finishTrial(trial_data);
        }, trial.feedback_duration);
      }
    }

    document.getElementById('plugin-1').addEventListener('click', (e) => selectChoice(1, e.target));
    document.getElementById('plugin-2').addEventListener('click', (e) => selectChoice(2, e.target));
    document.getElementById('plugin-3').addEventListener('click', (e) => selectChoice(3, e.target));
    document.getElementById('plugin-4').addEventListener('click', (e) => selectChoice(4, e.target));
  };

  return plugin;
})();
