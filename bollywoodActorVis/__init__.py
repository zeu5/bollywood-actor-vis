from flask import Flask, render_template, g, request, jsonify
from re import search, UNICODE
import sqlite3
import os
import csv


app = Flask(__name__)

app.config.update({
	'DATABASE' : os.path.join(app.root_path, 'bollywood-actor.db')
	})


def get_db():
	"""
	Opens a database connection if it doesnt exist otherwise returns from app context.
	"""
	if not hasattr(g, 'sqlite_db'):
		g.sqlite_db = sqlite3.connect(app.config.get('DATABASE'))
	return g.sqlite_db

def init_db():
	"""
	Reinitialises the database removing the previous data and populating it based on the csv
	"""
	db = get_db()
	with app.open_resource('schema.sql') as f:
		db.cursor().executescript(f.read())
	db.commit()
	populate_data(db)
	print "Initialised the database"


def populate_data(db):
	"""
	Fetch initial data from the csv in data/bollywood.celebrity.csv and insert into the database
	"""
	def get_csv_data():
		"""
		Retireves the csv as an array
		"""
		try:
			data = []
			with app.open_resource('data/bollywood.celebrity.csv') as csv_file:
				csv_reader = csv.reader(csv_file)
				header = csv_reader.next() #Header line Not needed
				for row in csv_reader:
					data.append(row)
			return data

		except Exception, e:
			print "Could not fetch data from the CSV"
			print e

	def insert_data(data_list, db):
		"""
		Inserts the data in the list into the database
		"""
		cursor = db.cursor()
		for data_row in data_list:
			try:
				cursor.execute('insert into celebrities values (?, ?, ?, ?, ?)',data_row)
			except Exception, e:
				# When it fails integrity error or null data is tried to be inserted
				continue
		db.commit()

	csv_data = get_csv_data()
	insert_data(csv_data,db)


@app.teardown_appcontext
def close_db(error):
	""" Close Database after request is processed """
	if hasattr(g,'sqlite_db'):
		g.sqlite_db.close()



@app.route('/',methods=["GET"])
def index():
	"""
	Returns the html page which makes API calls to the server
	"""
	return render_template('index.html')

@app.route('/get_movies', methods=["GET"])
def get_movies():
	"""
	Given an actor this API returns an array of movies the actor has acted in.
	The JSON format is an array of object where each object is a map of actor to an array of his movies
	[ { actor1 : [movie1, movie2] }, { actor2 : [movie2, movie3] } ]
	"""
	actors = request.args['actors']
	if search('([\w ]+,)*([\w ]+)',actors):
		# If actors are in comma seperated format
		actors = actors.split(',')
		result = {}
		db_cursor = get_db().cursor()
		for actor in actors:
			actor = actor.strip()
			db_cursor.execute('select distinct movie_name from celebrities where role=? and name=?',['Actor',actor])
			rows = db_cursor.fetchall()
			if len(rows):
				result[actor] = map(lambda x: x[0], rows)
		return jsonify(result)
	else:
		return ('',204)



@app.route('/get_actors', methods=["GET"])
def get_actors():
	"""
	Given an actor this API returns an array of actors who have acted in the movie.
	The JSON format is as follows
	[ { movie1 : [actor1, actor2] }, { movie2 : [actor2, actor3] } ]
	"""

	movies = request.args['movies']
	if search('([\w ]+,)*([\w ]+)',movies):
		# If movies are in comma seperated format
		movies = movies.split(',')
		result = {}
		db_cursor = get_db().cursor()
		for movie in movies:
			movie = movie.strip()
			db_cursor.execute('select distinct name from celebrities where role=? and movie_name=?',['Actor',movie])
			rows = db_cursor.fetchall()
			if len(rows):
				result[movie] = map(lambda x: x[0], rows)
		return jsonify(result)
	else:
		return ('',204)



















