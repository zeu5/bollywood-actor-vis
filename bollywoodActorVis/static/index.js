
	var server = (function(){
		
		return {
			"get_movies" : function(actors, callback){
		
				var actors_string;
				if( actors.constructor == Array ){ actors_string = actors.join(','); }
				else { actors_string = actors; }
	
				$.getJSON('/get_movies',{"actors": actors_string}).then(function(data, status_text, xhr_response){
					if(parseInt(xhr_response.status) === 200){
						if( actors.constructor == Array ){
							callback(data, actors);
						} else {
							callback(data[actors], actors);
						}
					}else {
						console.log("Could not fetch details, Server Response : ", status_text);
					}
				});
			},
	
			"get_actors" : function(movies, callback){
	
				var movies_string;
				if( movies.constructor == Array ){ movies_string = movies.join(','); }
				else { movies_string = movies; }
	
				$.getJSON('/get_actors',{"movies": movies_string}).then(function(data, status_text, xhr_response){
					if(parseInt(xhr_response.status) === 200){
						if( movies.constructor == Array ){
							callback(data, movies);
						} else {
							callback(data[movies], movies);
						}
					}else {
						console.log("Could not fetch details, Server Response : ", status_text);
					}
				});
			}
		}
	})();

	var graph = (function(){

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

		function matrix_transpose(matrix){
			d3.transpose(matrix);
		}

		function matrix_mul(matrix_a, matrix_b){
			var rows_a = matrix_a.length, cols_a = matrix_a[0].length,
				rows_b = matrix_b.length, cols_b = matrix_b[0].length;

			var result_matrix = new Array(rows_a);
			if(cols_a !== rows_b){

				//Cannot multiply
				return;
			} else {
				for (var i = 0; i < rows_a; i++) {
					result_matrix[i] = [];
					for (var j = 0; j < cols_b; j++) {
						result_matrix[i][j] = 0;
						for(var k = 0; k < rows_b; k++){
							result_matrix[i][j] += ( matrix_a[i][k] * matrix_b[k][j] );
						}
					}
				}
				return result_matrix;
			}
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

				if(!movies){
					movies = [];
				}

				if( actor_array.indexOf(actor.trim()) !== -1){
					// Actor already exists
					return;
				} else {
					var actor_index = actor_array.push(actor.trim()) - 1;
					actor_movie_array.push(get_zero_array(movie_array.length));

					// No need to go through every movie in the view only the one's that are given
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
				
				if(!actors){
					actors = [];
				}


				if( movie_array.indexOf(movie) !== -1){
					// Movie already exits
					return; 
				} else {
					movie_array.push(movie.trim());

					// Need to go through all the actors as a new column should be added
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

				if(!movies){
					movies = [];
				}

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

				if(!actors){
					actors = [];
				}

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
				if(!collapsed){
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
				actor_actor_array = matrix_mul( actor_movie_array * matrix_transpose(actor_movie_array) );
				return;
			}
		}
	})();

	var ui = (function(){

		var svg = d3.select("svg"), simulation, node, link, collapsed = false;
		    
		var color = d3.scaleOrdinal(d3.schemeCategory10);

		function init(){
			var width = parseInt(svg.attr('width'));
			var height = parseInt(svg.attr('height'));

			svg.append('g').attr('class','nodes');
			svg.append('g').attr('class','links');

			simulation = d3.forceSimulation()
			    .force("link", d3.forceLink())
			    .force("charge", d3.forceManyBody())
			    .force("center", d3.forceCenter(width / 2, height / 2))
			    .on('tick',simulation_tick);

			graph.add_actor("A. Morkel");
			update();    

		}    

		function update(){
			var nodes = graph.get_nodes(collapsed);
			var links = graph.get_links(collapsed);

			link = svg.select('g.links').selectAll('line').data(links);

			link.exit().remove();
			link.enter().append('line');

			node = svg.select('g.nodes').selectAll('circle').data(nodes);
			
			node.attr('fill',function(d){ return color(d.group); })
				.attr('title',function(d){return d.id;})
				.attr('r',function(d){return d.group*5;});
			
			node.enter()
				.append('circle')
				.attr('fill',function(d){ return color(d.group); })
				.attr('title',function(d){return d.id;})
				.attr('r',function(d){return d.group*5;});
			
			node.exit().remove();
			
			
			link = svg.select('g.links').selectAll('line');
			node = svg.select('g.nodes').selectAll('circle');

			node.on('click', node_click);

			simulation.nodes(nodes);
			simulation.force('link').links(links);
		}

		function simulation_tick(){
			link
				.attr('x1',function(d){ return d.source.x; })
				.attr('y1',function(d){ return d.source.y; })
				.attr('x2',function(d){ return d.target.x; })
				.attr('y2',function(d){ return d.target.y; });

			node
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; });

		}

		function node_click(data){
			if(data.group == 1){
				server.get_movies(data.id,function(data, actor){
					var movies_not_there = graph.update_actor(actor,data);
					if(movies_not_there.length === 0){return;}
					server.get_actors(movies_not_there,function(data, movies){
						movies.forEach(function(movie){
							graph.add_movie(movie,data[movie]);
						});
						update();
					});
				});
			} else if(data.group == 2){
				server.get_actors(data.id,function(data, movie){
					var actors_not_there = graph.update_movie(movie,data);
					if( actors_not_there.length === 0 ){ return; }
					server.get_movies(actors_not_there,function(data, actors){
						actors.forEach(function(actor){
							graph.add_actor(actor,data[actor]);
						});
						update();
					});
				});
			}
		}

		init();

		return null;

	})();
