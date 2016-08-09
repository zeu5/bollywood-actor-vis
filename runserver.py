from bollywoodActorVis import app, init_db

with app.app_context():
	init_db()

app.run(debug=True)
