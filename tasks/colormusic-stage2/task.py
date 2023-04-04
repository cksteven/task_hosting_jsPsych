import pandas as pd
import numpy as np
import os
import csv
from threading import Lock
import random
import copy
from collections import defaultdict

from utils.balance_utils import *
from utils.csv_utils import *
# from client.logger import logger

dirname = os.path.dirname(__file__)

# Need a lock for updating a file shared by all worker_ids
# this includes the images_counts_file
update_images_counts_file_lock = Lock()


class Task:
  def __init__(self, dev=False):
    # self.images_folder_path = dirname + '/images/'
    self.trial_lists_folder_path = dirname + '/trial_lists/'

    # self.audio_folder_path = dirname + '/audio/'


    env_folder_path = dirname + ('/dev/' if dev else '/prod/')
    if not os.path.exists(env_folder_path):
      os.mkdir(env_folder_path)

    self.trials_folder_path = env_folder_path + '/trials/'
    self.data_folder_path = env_folder_path + '/data1/'
    self.demographics_folder_path = env_folder_path + '/demographics/'
    self.trial_list_counts_file_path = env_folder_path + '/trial_list_counts.csv'
    self.consent_folder_path = env_folder_path + '/consent1/'

  def trials(self, worker_id, num_categories=None, reset=False):

    if num_categories is not None:
      num_categories = int(num_categories)
    if not os.path.exists(self.trials_folder_path):
      os.mkdir(self.trials_folder_path)
    trials_file_path = self.trials_folder_path + '/' + worker_id + '.csv'
    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'

    color_coords = self.get_color_coords()
    # music_list = self.get_music_list()

    if reset or not os.path.exists(trials_file_path):
      remove_files(demographics_file_path, consent_file_path, data_file_path, trials_file_path)

      # testoutput = open(dirname + '/' + 'DEBUG_FFFFFIRST.txt', 'w')
      # testoutput.write("????")
      # testoutput.close()

      trials = self.generate_trials(worker_id)
      # trials = []
      num_trials = len(trials)
      write_to_csv(trials_file_path, trials)
      completed_demographics = False
      consent_agreed = False

    else:
      trials = self.generate_trials(worker_id)
      # trials = []
      num_trials = len(trials)
      if os.path.exists(data_file_path):
        data = read_rows(data_file_path)
        num_data_rows = len(data)
        trials = trials[num_data_rows:]
      completed_demographics = os.path.exists(demographics_file_path)
      consent_agreed = os.path.exists(consent_file_path)

    return {
        "trials": trials,
        "num_trials": num_trials,
        "color_coords": color_coords,
        "completed_demographics": completed_demographics,
        "consent_agreed": consent_agreed,
        # "rel_images_folder_path": os.path.relpath(self.images_folder_path, dirname),
        # "rel_audio_folder_path": os.path.relpath(self.audio_folder_path, dirname),
    }

  def consent(self, worker_id):
    consent_file_path = self.consent_folder_path + '/' + worker_id + '.txt'
    if not os.path.exists(self.consent_folder_path):
      os.mkdir(self.consent_folder_path)
    write_to_csv(consent_file_path, {'response': 'yes'})
    return 200

  def data(self, worker_id, order, data):
    if not os.path.exists(self.data_folder_path):
      os.mkdir(self.data_folder_path)

    data_file_path = self.data_folder_path + '/' + worker_id + '.csv'
    append_to_csv(data_file_path, data, order=order)

  def demographics(self, worker_id, demographics):
    if not os.path.isdir(self.demographics_folder_path):
      os.mkdir(self.demographics_folder_path)

    demographics_file_path = self.demographics_folder_path + '/' + worker_id + '.csv'

    write_to_csv(demographics_file_path,
                 dict({"subj_code": worker_id}, **demographics),
                 order=["subj_code"] + demographics.keys())

    return 200

  ########################################################
  # HELPERS
  ########################################################

  def get_color_coords(self):
    coord_filename = "coordinate.csv"
    rows = read_rows(self.trial_lists_folder_path + '/' + coord_filename)
    return rows

  def get_music_list(self):
    filename = "music_trials.csv"
    rows = read_rows(self.trial_lists_folder_path + '/' + filename)
    return rows

  def add_type(self, row, type):
    row["type"] = type
    return row

  def generate_trials(self, worker_id, randomize_order=True):
    global_rows = []

    music_list = self.get_music_list()

    rows = [{'type': 'colormusic', 'content': row} for row in music_list]
    global_rows += rows

    color_coords = self.get_color_coords()
    color_coords = [row for row in color_coords if row['color'] != 'Background']

    list_filename = "anchors_semantic_ratings.csv"
    rows = read_rows(self.trial_lists_folder_path + '/' + list_filename)
    rows = [{'type': 'color', 'content': {'anchors': row, 'color': color}} for color in color_coords for row in rows]
    global_rows += rows

    list_filename = "anchors_semantic_ratings.csv"
    rows = read_rows(self.trial_lists_folder_path + '/' + list_filename)
    rows = [{'type': 'music', 'content': {'anchors': row, 'music': music}} for music in music_list for row in rows]
    global_rows += rows

    list_filename = "music_matching_stimuli.csv"
    rows = read_rows(self.trial_lists_folder_path + '/' + list_filename)
    rows = [{'type': 'musicmusic', 'content': row} for row in rows]
    global_rows += rows

    if randomize_order:
      random.shuffle(global_rows)

    trials = [
        dict({'trial_number': index + 1}, **row) for index, row in enumerate(global_rows)
    ]

    return trials
