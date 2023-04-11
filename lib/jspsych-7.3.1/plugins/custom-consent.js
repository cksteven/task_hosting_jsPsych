/** Edited by Kesong Cao in Dec 2022
*/

var jsPsychCustomConsent = (function (jspsych) {
  'use strict';

  const info = {
    name: 'custom-consent',
    description: '',
    parameters: {
      url: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'URL',
        default: undefined,
        description: 'The url of the external html page',
      },
      alert: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Alert content',
        default: null,
        description:
          'Alert content to display if continue button is clicked without the consent checked.',
      },
    },
  };

  class CustomConsentPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      display_element.innerHTML = '';

      var localJsPsychVar = this.jsPsych;

      load(display_element, trial.url, function () {
        var t0 = performance.now();

        var finish = function () {
          if (!document.getElementById('plugin-checkbox').checked) {
            alert(trial.alert);
            return;
          }
          var trial_data = {
            rt: performance.now() - t0,
            url: trial.url,
          };
          display_element.innerHTML = '';
          localJsPsychVar.finishTrial(trial_data);
        };

        document.getElementById('plugin-start').addEventListener('click', finish);
      }
      );

      // helper to load via XMLHttpRequest
      function load(element, file, callback) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', file, true);
        xmlhttp.onload = function () {
          if (xmlhttp.status == 200 || xmlhttp.status == 0) {
            //Check if loaded
            element.innerHTML = xmlhttp.responseText;
            callback();
          }
        };
        xmlhttp.send();
      }
    };

  }
  CustomConsentPlugin.info = info;

  return CustomConsentPlugin;

})(jsPsychModule);
