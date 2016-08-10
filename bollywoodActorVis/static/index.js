$(function(){


	function server_class(){
		
		this.get_movies = function(actor_name){

			function process_response(data, status_text){
				if(status_text === "OK"){
					data.update_movies(data.Movies, actor_name);
				}else {
					console.log("Could not fetch details, Server Response : ", status_text);
				}
			}

			$.getJSON('/get_movies',{"actor_name": actor_name},process_response);
		}

		this.get_actors = function(movie_name){
			
			function process_response(data, status_text){
				if(status_text === "OK"){
					data.update_actors(data.Actors, movie_name);
				}else {
					console.log("Could not fetch details, Server Response : ", status_text);
				}
			}

			$.getJSON('/get_movies',{"movie_name": movie_name},process_response);
		}

	}


	function data_class(){

		var actor_array = [];
		var movie_array = [];
		var actor_movie_array = [];

		this.update_actors = function(actors, movie_name){
			actors.forEach(function(actor){
				if(actor_array.indexOf(actor) == -1){
					actor_array.push(actor);
					actor_movie_array.push([]);
				}
			})
		}


	}




});