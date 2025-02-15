/*
 * Example plugin template
 */

jsPsych.plugins['lupyanlab-cue-response-ratings'] = (function() {
  var plugin = {};

  plugin.info = {
    name: 'lupyanlab-cue-response-ratings',
    parameters: {
      trial_progress_text: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Trial progress text',
        default: null,
        description: 'Text to display below progress bar',
      },
      cue: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Cue',
        default: null,
        description: 'The cue',
      },
      response_word: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Response',
        default: null,
        description: 'The response',
      },
      question_prompt_pre: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Pre',
        default: null,
        description: 'Text shown before question',
      },
      question_prompt_mid: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Mid',
        default: null,
        description: 'Text shown mid question',
      },
      question_prompt_post: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Post',
        default: null,
        description: 'Text to display after the question',
      },
      choices: {
        type: jsPsych.plugins.parameterType.COMPLEX,
        array: true,
        pretty_name: 'Choices',
        default: undefined,
        description:
          'The choices the subject is shown using keys 1 to n where n is number of choices.',
      },
      input_feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Time for input feedback',
        default: null,
        description: 'Set the time for how long the input feedback lasts for.',
      },
            is_skip: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Is skip enabled',
        default: true,
        description: 'Enable skip or not',
      },
      skip_button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Skip button label',
        default: 'Skip',
        description: 'Label of the skip button.',
      },
      skip_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Skip label',
        default: '',
        description: 'Label to show above the skip button.',
      },
      skipped_recorded_value: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Skip recorded value',
        default: 'skipped',
        description: 'String value that is recorded if skipped.',
      },
    },
  };

  plugin.trial = function(display_element, trial) {
    display_element.innerHTML = /* html */ `
    <style>
      #plugin-choices:before {
        content: '';
        position: absolute;
        top: 1.4em;
        display: block;
        background-color: #efefef;
        height: 4px;
        width: 100%;
        z-index: -10000;
      }
    </style>
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="margin-bottom:3em;">${trial.trial_progress_text}</div>
      <h3 style="font-weight:400; font-size:1.5em; margin-bottom:0.5em;">
      ${trial.question_prompt_pre}
      </h3>
      <h1 style="font-size:3em; margin:0;">${trial.response_word}</font></h1>
      <font size=4>${trial.question_prompt_mid}
      <h1 style="font-size:3em; margin:0;">${trial.cue}${trial.question_prompt_post}</h1>
      <div style="position:relative;">
        <div id="plugin-choices" style="display:grid; grid-template-columns:${trial.choices
          .map(() => '1fr')
          .join(' ')}; max-width:min(1000px, 90vw); margin:1em;">
          ${trial.choices
            .map(
              (choice, i) => /* html */ `
              <div style="display:flex; flex-direction:column; align-items:center">
                <input type="radio" id="plugin-radio-${i + 1}" name="${choice}" value="${i + 1}" />
                <label for="plugin-radio-${i + 1}" style="font-size:14px;">${choice}</label>
              </div>
            `,
            )
            .join('')}
        </div>
      </div>
          ${
        trial.is_skip
          ? /* html */ `<div style="display:flex; flex-direction:column; align-items:center; margin-top:2em;">
        <label class="jspsych-survey-likert-opt-label" style="margin:0.2em;">${trial.skip_label}</label>
        <input id="plugin-skip" type="button" class="jspsych-survey-likert jspsych-btn" style="width:14em;" value=${trial.skip_button_label}></input>
      </div>`
          : ''
      }
    </div>
    `;
    const startTime = performance.now();

    const choice_elements = trial.choices.map((_, i) =>
      document.getElementById(`plugin-radio-${i + 1}`),
    );

    let skip_button_element;
    if (trial.is_skip) {
      skip_button_element = document.getElementById('plugin-skip');
    }


    let selected = false;

    const end_trial = (selected_key) => {
      // Ignore any new keypresses or button clicks after a choice has been selected
      if (selected) {
        return;
      }
      selected = true;

      choice_elements.forEach((choice_element) => (choice_element.disabled = true));
      if (trial.is_skip) {
        skip_button_element.disabled = true;
      }
      const endTime = performance.now();
      const rt = endTime - startTime;
      const selected_label =
        selected_key !== undefined ? trial.choices[selected_key - 1] : trial.skipped_recorded_value;

      const trial_data = {
        rt: rt,
        key: selected_key === undefined ? trial.skipped_recorded_value : selected_key,
        response: selected_label,
      };

      jsPsych.pluginAPI.setTimeout(() => {
        jsPsych.finishTrial(trial_data);
      }, trial.input_feedback_duration);
    };

    choice_elements.forEach((choiceRadioEl) => {
      choiceRadioEl.addEventListener('click', () => end_trial(choiceRadioEl.value));
    });

    if (trial.is_skip) {
      skip_button_element.addEventListener('click', () => end_trial());
    }


    jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: ({ key: keyCode }) => {
        const key = jsPsych.pluginAPI.convertKeyCodeToKeyCharacter(keyCode);
        document.getElementById(`plugin-radio-${key}`).checked = true;
        document.getElementById(`plugin-radio-${key}`).dispatchEvent(new Event('click'));
      },
      valid_responses: trial.choices.map((_, i) =>
        jsPsych.pluginAPI.convertKeyCharacterToKeyCode(String(i + 1)),
      ),
      rt_method: 'performance',
      persist: false,
      allow_held_key: false,
    });
  };

  return plugin;
})();
