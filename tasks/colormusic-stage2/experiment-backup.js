import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';

const { workerId: worker_id, fullscreen, reset, num_categories } = searchParams;

(async () => {
  await loadJsPsychPlugins();

  const {
    trials,
    num_trials,
    completed_demographics,
    consent_agreed,
    rel_images_folder_path,
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset, num_categories },
  });

  const timeline = [];

  const fullscreen_trial = {
      type: 'fullscreen',
      fullscreen_mode: true,
      message: '<p>Please press continue to switch to full-screen mode</p>',
      button_label: 'Continue',
    };

    if (fullscreen)timeline.push(fullscreen_trial);
    
  const consent_trial = {
    type: 'lupyanlab-consent',
    url: './consent.html',
    alert:
      'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    on_finish: () => {
      api({ fn: 'consent', kwargs: { worker_id } });
    },
  };

  if (!consent_agreed) timeline.push(consent_trial);

  const continue_space = /* html */ `<div class='right small'>(press SPACE to continue)</div>`;

  const instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      /* html */ `<p class="lead">In this HIT, you will be shown sets of images and asked to indicate how similar the two sets are. Each set of images represents a concept, for example "happy" or "cow" or "tall". For example, you may be shown various images of cows on the left and various images of ocean on the right. Some of the comparisons may seem odd, but just go with your first impression.  Please make your judgments based on the <b>set</b> of images rather than on any specific image. 

      </p> <p class="lead">You can use the mouse or 1-7 keyboard keys to respond. 1 means very similar. 7 means completely different. Please try to use the entire scale, not just the 1/7 keys. If you rush through without attending to the images, we may deny payment.
      </p> ${continue_space}`,
    ],
  };
  if (trials.length > 0) timeline.push(instructions);

  const image_trials_block = {
    type: 'lupyanlab-image-similarity',
    input_feedback_duration: 500,
    // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
    timeline: trials.map((trial) => ({
      trial_progress_text: `Trial ${Number(trial.trial_number)} of ${num_trials}`,
      prompt: `How similar is ${trial.object}?`,
      left_image: rel_images_folder_path + '/' + trial.image_1,
      right_image: rel_images_folder_path + '/' + trial.image_2,
      shape_image: trial.shape_image,
      keys: [
        trial.option_1,
        trial.option_2,
        trial.option_3,
        trial.option_4,
        trial.option_5,
        trial.option_6,
        trial.option_7,
      ].map((_, i) => `${i + 1}`),
      labels: [
        trial.option_1,
        trial.option_2,
        trial.option_3,
        trial.option_4,
        trial.option_5,
        trial.option_6,
        trial.option_7,
      ],
      on_start: () => {
        jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
      },
      on_finish: ({ rt, key, label }) => {
        const data = {
          subj_code: worker_id,
          choice_label: label,
          choice_key: key,
          rt,
          ...trial,
        };

        api({
          fn: 'data',
          kwargs: {
            worker_id,
            data,
            order: Object.keys(data),
          },
        });
      },
    })),
  };
  timeline.push(image_trials_block);

  const demographics_questions_instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!
            </p> ${continue_space}`,
    ],
  };
  if (!completed_demographics) timeline.push(demographics_questions_instructions);

  const demographics_trial = {
    type: 'lupyanlab-surveyjs',
    questions: demographics_questions,
    on_finish: ({ response }) => {
      api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
    },
  };
  if (!completed_demographics) timeline.push(demographics_trial);

	//create random code for final message
  const randLetter = () => {
      var a_z = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var int = Math.floor(Math.random() * a_z.length);
      var rand_letter = a_z[int];
      return rand_letter;
    };

    var secretCode = 'zhrz'; // this is the 'key'
    var code = '';

    for (let i = 0; i < 7; i++) {
      code = code.concat(randLetter());
    }

    code = code.concat(secretCode);

    for (let i = 0; i < 7; i++) {
      code = code.concat(randLetter());
    }


  const debrief_block = {
    type: 'html-keyboard-response',
    choices: [],
    stimulus: function() {
      return /* html */ `Thank you for participating!
        <p>The purpose of this HIT is to assess the extent to which different people think irrelevant concepts are similar.</p>
      <br><br>
        <center>Your completion code for mTurk is</center>
        <br>
        <center><u><b style="font-size:20px">${code}</b></u></center>
        <br>
        <center>Please copy/paste this code into the mTurk box'</center>
        <br>
        If you have any questions or comments, please email qliu295@wisc.edu.`;
    },
  };
  timeline.push(debrief_block);

  jsPsych.init({
    timeline: timeline,
    fullscreen,
    show_progress_bar: true,
    auto_update_progress_bar: false,
  });
})();
