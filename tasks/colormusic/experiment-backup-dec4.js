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
    // rel_audio_folder_path
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset, num_categories },
  });

  const timeline = [];


  const rel_audio_folder_path = './music_short';
  const rel_audiocheck_path = './audiocheck';

  const fullscreen_trial = {
    type: 'fullscreen',
    fullscreen_mode: true,
    message: '<p>Please press continue to switch to full-screen mode</p>',
    button_label: 'Continue',
  };

  if (fullscreen) timeline.push(fullscreen_trial);

  const consent_trial = {
    type: 'lupyanlab-consent',
    url: './consent.html',
    alert:
    'If you wish to participate, you must check the box next to the statement "I agree to participate in this study."',
    on_finish: () => {
      api({ fn: 'consent', kwargs: { worker_id } });
    },
    on_start: () => {
      console.log("DEBUG: trials", trials);
    }
  };

  if (!consent_agreed) timeline.push(consent_trial);

  const continue_space = /* html */ `<div class='right small'>(press SPACE to continue)</div>`;


  const instructions_assess = {
    type: 'instructions',
    pages: [
      /* html */ `<p>
      Before you start the main task, we have four short <b>audio questions</b> to make sure you speak English well enough to participate.
      </p><p>
      These questions are very easy, but you will need to <b>turn up the sound on your computer</b> to be able to hear the questions.
      </p><p>
      Please make sure you answer these four questions correctly. If you answer incorrectly we may not compensate you for your participation.
      </p>`,
    ],
    show_clickable_nav: true,
  };
  if (trials.length > 0) timeline.push(instructions_assess);

  const assess_block = {
    type: 'lupyanlab-audio-button-response',
    input_feedback_duration: 500,
    timeline: trials
      .filter(trial => trial.type === "assess")
      .map((trial) => ({
      prompt:
      /*html*/ `<br>This is an <b>audio question</b>, please make sure the sound on your computer is on.<br>
      To replay the question, <b>press R</b> on your keyboard.`,

      stimulus: rel_audiocheck_path + '/' + trial.music1 + ".mp3",
      choices: trial.color1.split(','),

      questions: [{ prompt: '', name: '', rows: 1, columns: 30, required: true }],
      on_start: () => {
        jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
      },
      on_finish: ({ rt, button_pressed }) => {
        const data = {
          subj_code: worker_id,
          choice_label: button_pressed,
          choice_key: button_pressed,
          rt,
          ...trial,
        };

        // return api({
        //   fn: 'data',
        //   kwargs: {
        //     worker_id,
        //     data: {
        //       response: button_pressed,
        //       rt: rt,
        //       ...trial,
        //     },
        //   },
        // });

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
  timeline.push(assess_block);


  const instructions = {
    type: 'instructions',
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      /* html */ `
      <h1> THIS TEXT TO BE CHANGED </h1>

      <p class="lead">In this HIT, you will be shown sets of images and asked to indicate how similar the two sets are. Each set of images represents a concept, for example "happy" or "cow" or "tall". For example, you may be shown various images of cows on the left and various images of ocean on the right. Some of the comparisons may seem odd, but just go with your first impression.  Please make your judgments based on the <b>set</b> of images rather than on any specific image.

      </p> <p class="lead">You can use the mouse or 1-7 keyboard keys to respond. 1 means very similar. 7 means completely different. Please try to use the entire scale, not just the 1/7 keys. If you rush through without attending to the images, we may deny payment.
      </p> ${continue_space}`,
    ],
  };
  if (trials.length > 0) timeline.push(instructions);

  // const rel_audio_folder_path = rel_images_folder_path;

  const helper_minute_second = (minute_colon_second) => {
    const minute = parseInt(minute_colon_second.split(":")[0]);
    const second = parseInt(minute_colon_second.split(":")[1]);
    const res = minute * 60 + second;
    // console.log(minute, second, res);
    return res;
  }

  const randomize_lr = (trial) => {
    if (Math.random() >= 0.5) return trial;

    let modified_trial = Object.assign({}, trial);
    // swap color1,color2,coord1,coord2,music1,music2,start1,start2
    modified_trial.color1 = trial.color2;
    modified_trial.color2 = trial.color1;
    modified_trial.coord1 = trial.coord2;
    modified_trial.coord2 = trial.coord1;
    modified_trial.music1 = trial.music2;
    modified_trial.music2 = trial.music1;
    modified_trial.start1 = trial.start2;
    modified_trial.start2 = trial.start1;
    console.log("one trial was LEFT-RIGHT SWAPPED from source trial list data");

    return modified_trial;
  }

  const image_trials_block = {
    type: 'lupyanlab-image-similarity-with-audio',
    input_feedback_duration: 500,
    // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
    timeline: trials
    .filter(trial => trial.type != "assess")
    .map(trial => randomize_lr(trial))
    .map((trial) => ({
      //   trial_progress_text: `Trial ${Number(trial.trial_number)} of ${num_trials}`,
      // prompt: `How similar is ${trial.object}?`,
      //   prompt: `How similar is PLACEHOLDER TEXT?`,
      // left_image: rel_images_folder_path + '/' + trial.image_1,
      // right_image: rel_images_folder_path + '/' + trial.image_2,
      left_color: trial.coord1,
      right_color: trial.coord2,
      // left_audio: rel_audio_folder_path + '/' + 'left_image.mp3',
      // right_audio: rel_audio_folder_path + '/' + 'right_image.mp3',
      left_audio: rel_audio_folder_path + '/' + trial.music1 + ".mp3",
      right_audio: rel_audio_folder_path + '/' + trial.music2 + ".mp3",
      left_audio_start: helper_minute_second(trial.start1),
      right_audio_start: helper_minute_second(trial.start2),
      left_audio_end: helper_minute_second(trial.start1) + 15,
      right_audio_end: helper_minute_second(trial.start2) + 15,
      //   shape_image: trial.shape_image,
      keys: [
        "content doesn't matter", "number of items here matters"
      ].map((_, i) => `${i}`),
      labels: [
        "(Left)", "(Right)"
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
    stimulus: function () {
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
