$(function(){


	var server = (function(){
		
		return {
			"get_movies" : function(actors, callback){
		
				var actors_string = actors.join(',');
	
				$.getJSON('/get_movies',{"actors": actors_string}).then(function(data, status_text){
					if(status_text === "OK"){
						callback(data, actors);
					}else {
						console.log("Could not fetch details, Server Response : ", status_text);
					}
				});
			},
	
			"get_actors" : function(movies, callback){
	
				var movies_string = movies.join(',');
	
				$.getJSON('/get_actors',{"movies": movies_string}).then(function(data, status_text){
					if(status_text === "OK"){
						callback(data, movies);
					}else {
						console.log("Could not fetch details, Server Response : ", status_text);
					}
				});
			}
		}
	})();

	var data = (function(){

		var actor_array = [];
		var movie_array = [];
		var actor_movie_array = [];
		var actor_actor_array = [];


		function get_zero_array(n){
			var array = [];
			for(;n>0;n--){
				array.push(0);
			}
			return array;
		}

		return {

			"has_actor" : function(actor){
				
				// Checks if the specified actor is already displayed
				 
				return actor_array.indexOf(actor.trim()) !== -1;
			},

			"has_movie" : function(movie){

				// Checks if the specified movie is already displayed
				
				return movie_array.indexOf(movie.trim()) !== -1;
			},

			"add_actor" : function(actor, movies){

				// Given actor and movie list add row for actor and update with those movies that exist in the view
				// Discard the rest of the movies

				if( actor_array.indexOf(actor.trim()) !== -1){
					// Actor already exists
					return;
				} else {
					var actor_index = actor_array.push(actor.trim()) - 1;
					actor_movie_array.push(get_zero_array(movie_array.length));
					for( var i = 0; i< movies.length; i++ ){
						var movie_index = movie_array.indexOf(movies[i]);
						if( movie_index !== -1){
							actor_movie_array[actor_index][movie_index] = 1;
						}
					}
				}
			},

			"add_movie" : function(movie, actors){

				// Given movie and actor list add column for all actors and update with those actors that exist in the view
				// Discard the rest of the actors

				if( movie_array.indexOf(movie) !== -1){
					// Movie already exits
					return; 
				} else {
					movie_array.push(movie.trim());
					for(var i = 0; i < actor_array.length; i++){
						if (actors.indexOf(actor_array[i]) === -1){
							actor_movie_array[i].push(0);
						} else {
							actor_movie_array[i].push(1);
						}
					}
				}


				return;

			},

			"update_actor" : function(actor, movies){

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
			},

			"update_movie" : function(movie, actors){

				//Update for the existing actors that movie column and return those actors which does not exist.

				var movie_index = movie_array.indexOf(movie.trim());
				if( movie_index === -1){
					// Movie doesn't exists
					return;
				} else{

					var actor_not_there = [];
					for( var i = 0; i< actors.length; i++ ){
						var actor_index = actor_array.indexOf(actors[i]);
						if( actor_index !== -1){
							actor_movie_array[actor_index][movie_index] = 1;
						} else {
							actor_not_there.push(actors[i]);
						}
					}

					return actor_not_there;
				}
			},

			"get_nodes" : function(collapsed){

				//Returns nodes to be used for d3 force layout. The actors come first then the movies. If collapsed the movies are skipped

				var nodes = [];
				for(var i = 0 ; i<actor_array.length; i++){
					nodes.push({
						"id" : actor_array[i],
						"group" : 1
					});
				}
				if(collapsed){
					for(var i = 0 ; i<movie_array.length; i++){
						nodes.push({
							"id" : movie_array[i],
							"group" : 2
						});
					}
				}

				return nodes;
			},

			"get_links" : function(collapsed){

				// Returns links that can be used by d3 force layout. If collapsed then only actors are linked else actors are linked to movies

				var links = [];

				if(collapsed){
					for (var i = 0; i < actor_array.length; i++) {
						for (var j = 0; j < actor_array.length; j++) {
							if(actor_actor_array[i][j]){
								links.push({
									"source" : i,
									"target" : j,
									"value" : actor_actor_array[i][j]
								})
							}
						}
					}
				} else {
					for (var i = 0; i < actor_array.length; i++) {
						for (var j = 0; j < movie_array.length; j++) {
							if (actor_movie_array[i][j]){
								links.push({
									"source" : i,
									"target" : actor_array.length+j
								})
							}
						}
					}
				}

				return links;
			},

			"collapse_movies" : function(){
				// To compute the actor to actor adjacency matrix. actor_movie_array * transpose (actor_movie_array)

				return;
			}
		}
	})();




});