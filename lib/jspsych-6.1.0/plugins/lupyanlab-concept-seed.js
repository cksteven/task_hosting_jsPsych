jsPsych.plugins['lupyanlab-concept-seed'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-concept',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      concept_pre: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'CONCEPT: ',
      },
      concept: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
      },
      anchor_neg: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
      },
      anchor_pos: {
        type: jsPsych.plugins.parameterType.STRING,
        default: '',
      },
      choices: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        default: undefined,
      },
      input_feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        default: undefined,
      },
      on_submit: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        default: async () => {},
      },
      skip: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
      },
      show_quit: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
      },
      on_quit: {
        type: jsPsych.plugins.parameterType.FUNCTION,
        default: () => {},
      },
      quit_text: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'Quit',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    2;
    if (trial.skip) {
      jsPsych.finishTrial({});
      return;
    }

    display_element.innerHTML = /* html */ `
    <style>
      #plugin-scale-you .plugin-selected {
        background: linear-gradient(palegreen, mediumseagreen);
      }
      #plugin-scale-others .plugin-selected {
        background: linear-gradient(orange, darkorange);
      }
      #plugin-scale-others .plugin-mean {
        border: solid !important;
      }
      .disabled {
        cursor: not-allowed !important;
      }
      .transparent {
        opacity: 0.5;
      }
    </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="display:flex; width:40em; max-width:90vw;">
        ${trial.trial_progress_text !== null ? /* html */ `<h3>${trial.trial_progress_text}` : ''}
      </div>
      ${
        trial.show_quit
          ? /* html */ `
            <div style="display:flex; width:40em; max-width:90vw;">
              <input id="plugin-quit" style="margin-left:auto;" type="button" value="${trial.quit_text}" />
            </div>`
          : ''
      }
      <h1>${trial.concept_pre + trial.concept}</h1>
      <div style="display:flex; flex-wrap:wrap; flex-direction:column; justify-content:center;">
        <div style="display:flex; flex-direction:column; align-items:center; margin:1em;">
          <div style="display:flex; flex-direction:column; justify-content:center; margin:1em; width:25em; max-width:90vw;">
            <div id="plugin-scale-you" style="margin:1em; display:grid; grid-template-rows:2em; grid-template-columns:${trial.choices
              .map(() => '1fr')
              .join(' ')}; border:solid; border-radius:0.5em;">
                ${trial.choices
                  .map(
                    (choice, i) =>
                      /*html*/ `<div choice="${choice}" id="plugin-choice-you-${choice}" style="display:flex; align-items:center; justify-content:center; border:thin solid; border-radius:0.3em; margin:0.1em; cursor:pointer;">${i +
                        1}</div>`,
                  )
                  .join('')}
              </div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <h4 style="margin:0;">${trial.anchor_neg}</h4>
                <h4 style="margin:0;">${trial.anchor_pos}</h4>
              </div>
          </div>
        </div>
      </div>
    </div>
    `;

    if (trial.show_quit) {
      document.querySelector('#plugin-quit').addEventListener('click', () => {
        trial.on_quit();
        jsPsych.finishTrial({});
      });
    }

    const startTime = performance.now();
    let selected = false;

    const selectChoice = async (choice) => {
      if (!selected) {
        selected = true;
        display_element
          .querySelector(`#plugin-choice-you-${choice}`)
          .classList.add('plugin-selected');

        const endTime = performance.now();
        const rt = endTime - startTime;

        // data saving
        const trial_data = {
          rt,
          you_choice: choice,
        };

        jsPsych.pluginAPI.setTimeout(function() {
          jsPsych.finishTrial(trial_data);
        }, trial.input_feedback_duration);
      }
    };

    trial.choices.forEach((choice) => {
      display_element
        .querySelector(`#plugin-choice-you-${choice}`)
        .addEventListener('click', () => {
          selectChoice(choice);
        });
    });

    jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: ({ key: keyCode }) => {
        const key = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyCode);
        selectChoice(key);
      },
      valid_responses: trial.choices.map((choice) =>
        jsPsych.pluginAPI.convertKeyCharacterToKeyCode(String(choice)),
      ),
      rt_method: 'performance',
      persist: true, // jsPsych.pluginAPI.cancelKeyboardResponse
      allow_held_key: false,
    });
  };

  return plugin;
})();
