$(function(){


	function server_class(){
		
		this.get_movies = function(actors, callback){

			var actors_string = actors.join(',');

			$.getJSON('/get_movies',{"actors": actors_string}.then(function(data, status_text){
				if(status_text === "OK"){
					callback(data, actors);
				}else {
					console.log("Could not fetch details, Server Response : ", status_text);
				}
			});
		}

		this.get_actors = function(movies, callback){

			var movies_string = movies.join(',');

			$.getJSON('/get_actors',{"movies": movies_string}.then(function(data, status_text){
				if(status_text === "OK"){
					callback(data, movies);
				}else {
					console.log("Could not fetch details, Server Response : ", status_text);
				}
			});
		}
	}

	function data_class(){

		var actor_array = [];
		var movie_array = [];
		var actor_movie_array = [];


		function get_zero_array(n){
			var array = [];
			for(;n>0;n--){
				array.push(0);
			}
			return array;
		}

		this.has_actor = function(actor){
			
			// Checks if the specified actor is already displayed
			 
			return actor_array.indexOf(actor.trim()) !== -1;
		}

		this.has_movie = function(movie){

			// Checks if the specified movie is already displayed
			
			return movie_array.indexOf(movie.trim()) !== -1;
		}

		this.add_actor = function(actor, movies){

			// Given actor and movie list add row for actor and update with those movies that exist in the view
			// Discard the rest of the movies

			if( actor_array.indexOf(actor.trim()) !== -1){
				// Actor already exists
				return;
			} else{
				actor_array.push(actor.trim());
				var actor_index = actor_movie_array.push(get_zero_array(movie_array.length)) - 1;
				for( var i = 0; i< movies.length; i++ ){
					var movie_index = movie_array.indexOf(movies[i]);
					if( movie_index !== -1){
						actor_movie_array[actor_index][movie_index] = 1;
					}
				}
			}
		}

		this.add_movie = function(movie, actors){

			// Given movie and actor list add column for all actors and update with those movies that exist in the view
			// Discard the rest of the actors

			return;

		}

		this.update_actor = function(actor, movies){

			// Update for that actor with the movies that exist in view and return those that dont exist

			var actor_index = actor_array.indexOf(actor.trim());
			if( actor_index === -1){
				// Actor doesn't exists
				return;
			} else{

				var movie_not_there = [];
				for( var i = 0; i< movies.length; i++ ){
					var movie_index = movie_array.indexOf(movies[i]);
					if( movie_index !== -1){
						actor_movie_array[actor_index][movie_index] = 1;
					} else {
						movie_not_there.push(movies[i]);
					}
				}

				return movie_not_there;
			}
		}

		this.update_movie = function(movie, actors){

			//Update for the existing actors that movie column and return those actors which does not exist.

			return;
		}


	}




});