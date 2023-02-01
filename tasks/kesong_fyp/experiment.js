import loadJsPsychPlugins from '../../utils/load-jspsych-plugins.js';
import api from '../../utils/api.js';
// import demographics_questions from './demograhpics.js';
import searchParams from '../../utils/search-params.js';

const {
  workerId: worker_id, // case sensitive, must be "workerId" for hosting on cloudresearch.com
  fullscreen,
  reset,
  num_categories
} = searchParams;


(async () => {
  await loadJsPsychPlugins();

  const {
    trials,
    num_trials,
    // completed_demographics,
    consent_agreed,
    rel_images_folder_path,
    // rel_audio_folder_path
  } = await api({
    fn: 'trials',
    kwargs: { worker_id, reset, num_categories },
  });
  console.log("all trials", trials);


  const timeline = [];

  var preload = {
    type: jsPsychPreload,
    auto_preload: true
  }
  timeline.push(preload);

  //   const rel_audio_folder_path = './music_short';
  //   const rel_audiocheck_path = './audiocheck';

  const fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: '<p>Please press continue to switch to full-screen mode</p>',
    button_label: 'Continue',
  };

  if (fullscreen) timeline.push(fullscreen_trial);

  const consent_trial = {
    type: jsPsychCustomConsent,
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

  // const qualtrics_link = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_bJ9xVld2PXvp0ns?workerId=" + worker_id;
  const qualtrics_link = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_0MMtnOOvZMmN9uS?workerId=" + worker_id;


  const instructions_assess = {
    type: jsPsychInstructions,
    // key_forward: 'ArrowRight',
    // key_backward: 'Backspace',
    pages: [
      /* html */ `
      <h1> Instruction and examples </h1>

      <p> In this experiment, you are asked to <b>rate object shapes</b>.
      On a 1 to 7 scale, <b>1 being least spiky (extremely round)</b> and <b>7 being extremely spiky (least round)</b>,
      please rate the shape of the object in each following image you see. </p>

      <p> Before you start the main task, we have a few examples to demostrate
      what is a typical round or spiky object.</p>

      <p>
      You can press the number keys (1, 2, 3, 4, 5, 6, 7)
      on your keyboard to select your rating.
      Please use your instinct to rate the object shape.
      If you are not sure, just go with whatever feels right.
      </p>

      <p>
      Please do not refresh the page or use the back button on your browser.
      </p>
      `,
    ],
    show_clickable_nav: true,
  };
  if (trials.length > 0) timeline.push(instructions_assess);

  const assess_block = {
    type: jsPsychCustomImageKeyboardResponseBbox,
    input_feedback_duration: 500,
    timeline: trials
      .filter(trial => (trial.type === "assess1" || trial.type === "assess7"))
      .map((trial) => ({
        type: jsPsychCustomImageKeyboardResponseBbox,
        prompt:
      /*html*/ trial.type === "assess1" ?
            `<br /> This is an example of a <b>least spiky (extremely round)</b> object. Therefore please select <b>1</b> on the scale by pressing 1 on your keyboard.`
            : `<br /> This is an example of a <b>extremely spiky (least round)</b> object. Therefore please select <b>7</b> on the scale by pressing 7 on your keyboard.`,

        stimulus: rel_images_folder_path + '/' + trial.img_id + ".jpg",
        choices: ['1', '2', '3', '4', '5', '6', '7'],
        stimulus_bbox_ulx: Number.parseInt(trial.bbox0),
        stimulus_bbox_uly: Number.parseInt(trial.bbox2),
        stimulus_bbox_lrx: Number.parseInt(trial.bbox1),
        stimulus_bbox_lry: Number.parseInt(trial.bbox3),

        on_start: () => {
          console.log("this trial", trial);
          // jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
        },
        on_finish: ({ rt, response }) => {
          console.log("rt and response", rt, response);
          const data = {
            subj_code: worker_id,
            choice_label: response,
            choice_key: response,
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
    type: jsPsychInstructions,
    key_forward: 'space',
    key_backward: 'backspace',
    pages: [
      /* html */ `
      <h1> Instruction for the main task </h1>

      <p>
      In this experiment, you will see about 200 images.
      In each image, there is one main object bounded by a red rectangle.
      Your task is to <b>rate the object shape</b> on a 1 to 7 scale,
      <b>1 being least spiky (extremely round)</b> and <b>7 being extremely spiky (least round)</b>.
      </p>

      <p>
      You can press the number keys (1, 2, 3, 4, 5, 6, 7)
      on your keyboard to select your rating.
      Please use your instinct to rate the object shape.
      If you are not sure, just go with whatever feels right.
      </p>

      <p>
      When you are done with this shape rating task, you will be taken to a survey.
      Please make sure to carefully complete the ratings and the survey.
      </p>

      <p>
      Please do not refresh the page or use the back button on your browser.
      </p>
      `,
    ],
    show_clickable_nav: true,
  };
  if (trials.length > 0) timeline.push(instructions);


  const image_trials_block = {
    type: jsPsychCustomImageKeyboardResponseBbox,
    input_feedback_duration: 500,
    // Nested timeline:  https://www.jspsych.org/overview/timeline/#nested-timelines
    timeline: trials
      .filter(trial => trial.type == "main")
      //   .map(trial => randomize_lr(trial))
      .map((trial) => ({
        //   trial_progress_text: `Trial ${Number(trial.trial_number)} of ${num_trials}`,
        // prompt: `How similar is ${trial.object}?`,
        //   prompt: `How similar is PLACEHOLDER TEXT?`,
        // image: rel_images_folder_path + '/' + trial.image_1,
        // right_image: rel_images_folder_path + '/' + trial.image_2,
        // color_coord: Object.values(JSON.parse(trial.color_coord.replace(/'/g, '"'))).map(x => x.toString()),
        //   color_coord: trial.color_coord,
        //   right_color: trial.coord2,
        // audio: rel_audio_folder_path + '/' + 'image.mp3',
        // right_audio: rel_audio_folder_path + '/' + 'right_image.mp3',
        //   audio: rel_audio_folder_path + '/' + trial.music + ".mp3",
        //   right_audio: rel_audio_folder_path + '/' + trial.music2 + ".mp3",
        //   audio_start: 0,
        //   right_audio_start: helper_minute_second(trial.start2),
        //   audio_end: 15,
        //   right_audio_end: helper_minute_second(trial.start2) + 15,
        //   shape_image: trial.shape_image,
        //   keys: trial.color.map((_, i) => `${i}`).concat(['4']),
        //   labels: trial.color.concat(["I don'hear any music."]),
        stimulus: rel_images_folder_path + '/' + trial.img_id + ".jpg",
        choices: ['1', '2', '3', '4', '5', '6', '7'],
        stimulus_bbox_ulx: Number.parseInt(trial.bbox0),
        stimulus_bbox_uly: Number.parseInt(trial.bbox2),
        stimulus_bbox_lrx: Number.parseInt(trial.bbox1),
        stimulus_bbox_lry: Number.parseInt(trial.bbox3),
        prompt: `
        <p>
        1 is least spiky (extremely round). &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        7 is extremely spiky (least round).
        </p>

        <p>
        Press the number key (1 to 7) on your keyboard to select your rating.
        </p>
        `,
        on_start: () => {
          console.log("this trial", trial);
          jsPsych.setProgressBar((Number(trial.trial_number) - 1) / num_trials);
        },
        on_finish: ({ rt, response }) => {
          console.log("rt and response", rt, response);
          const data = {
            subj_code: worker_id,
            choice_label: response,
            choice_key: response,
            rt,
            ...trial,
          };

          console.log("data at finish:", data);

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

  // const demographics_questions_instructions = {
  //     type: 'instructions',
  //     key_forward: 'space',
  //     key_backward: 'backspace',
  //     pages: [
  //         `<p class="lead">Thank you! We'll now ask a few demographic questions and you'll be done!
  //   </p> ${continue_space}`,
  //     ],
  // };
  // if (!completed_demographics) timeline.push(demographics_questions_instructions);

  // const demographics_trial = {
  //     type: 'lupyanlab-surveyjs',
  //     questions: demographics_questions,
  //     on_finish: ({ response }) => {
  //         api({ fn: 'demographics', kwargs: { worker_id, demographics: response } });
  //     },
  // };
  // if (!completed_demographics) timeline.push(demographics_trial);

  const jump_to_qualtrics = {
    type: jsPsychInstructions,
    pages: [`<p> You will be redirected to a new page containing some survey questions. </p>
        <p> Please complete the survey in the new page. </p>
        <p> Reward will be offered only if you complete the survey. </p> <br />
        <p> If you are not being redirected automatically in 10s, please click this link:
        <a href="${qualtrics_link}"  target="_blank">${qualtrics_link} </a>
        </p> <br />
        <p> After you complete the survey, please feel free to close this page. </p>
        `],
    // show_clickable_nav: true,
    on_start: () => {
      console.log("qualtrics link:", qualtrics_link);
      setTimeout(() => {
        window.open(qualtrics_link, '_blank');
      }, 7000);
    }
  }
  timeline.push(jump_to_qualtrics);



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
    type: jsPsychHtmlKeyboardResponse,
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
      If you have any questions or comments, please email kesong.cao@wisc.edu.`;
    },
  };
  timeline.push(debrief_block);

  var jsPsych = initJsPsych({
    fullscreen,
    show_progress_bar: true,
    auto_update_progress_bar: false,
  });
  jsPsych.run(timeline);
})();
