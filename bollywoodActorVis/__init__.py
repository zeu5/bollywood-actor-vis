from flask import Flask, render_template, g
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
		g.sqlite_db = sqlite3.connect(app.config['DATABASE'])
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
				print "Count not insert entry into the database : ", " ".join(data_row)
				print e
				continue
		db.commit()


	def process_data(db):
		pass

	csv_data = get_csv_data()
	insert_data(csv_data,db)
	process_data(db)



@app.route('/',methods=["GET"])
def index():
	return render_template('index.html')
