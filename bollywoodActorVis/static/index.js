
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

		var actor_array = [],
			movie_array = [],
			actor_movie_array = [],
			actor_actor_array = [],
			nodes = [];


		function get_zero_array(n){
			var array = [];
			for(;n>0;n--){
				array.push(0);
			}
			return array;
		}

		function matrix_transpose(matrix){
			var rows = matrix.length ? matrix.length : null;
			var cols = matrix[0].length ? matrix[0].length : null;
			if( !rows || !cols ){
				return null;
			}
			var result = [];
			for(var i = 0; i < cols; i++){
				result.push([]);
				for (var j = 0; j < rows; j++) {
					result[i].push(matrix[j][i]);
				}
			}
			return result;
		}

		function matrix_mul(matrix_a, matrix_b){
			var rows_a = matrix_a.length ? matrix_a.length : null,
				cols_a = matrix_a[0].length ? matrix_a[0].length : null,
				rows_b = matrix_b.length ? matrix_b.length : null,
				cols_b = matrix_b[0].length ? matrix_b[0].length : null;

			if ( !rows_a || !rows_b || !cols_a || !cols_b){
				return null;
			}	

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
					nodes.push({
						"id" : actor.trim(),
						"group" : 1
					});

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
					nodes.push({
						"id" : movie.trim(),
						"group" : 2
					})

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

				// var nodes = [];
				// for(var i = 0 ; i<actor_array.length; i++){
				// 	nodes.push({
				// 		"id" : actor_array[i],
				// 		"group" : 1
				// 	});
				// }
				// if(!collapsed){
				// 	for(var i = 0 ; i<movie_array.length; i++){
				// 		nodes.push({
				// 			"id" : movie_array[i],
				// 			"group" : 2
				// 		});
				// 	}
				// }


				return collapsed? nodes.filter(function(node){return (node.group == 1 || node.group == 3)}) : nodes;
			},

			"get_links" : function(collapsed){

				// Returns links that can be used by d3 force layout. If collapsed then only actors are linked else actors are linked to movies

				var links = [];

				if(collapsed){
					for (var i = 0; i < actor_array.length; i++) {
						for (var j = 0; j < actor_array.length; j++) {
							if(actor_actor_array[i][j]){
								links.push({
									"source" : actor_array[i],
									"target" : actor_array[j],
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
									"source" : actor_array[i],
									"target" : movie_array[j]
								})
							}
						}
					}
				}

				return links;
			},

			"collapse_movies" : function(){
				// To compute the actor to actor adjacency matrix. actor_movie_array * transpose (actor_movie_array)
				actor_actor_array = matrix_mul( actor_movie_array, matrix_transpose(actor_movie_array) );
				return;
			},

			"generalise_nodes" : function(){
				nodes.forEach(function(node){
					if(node.group == 1){
						node.group = 3;
					} else if(node.group == 2){
						node.group = 4;
					}
				})
			}
		}
	})();

	var ui = (function(){

		var svg = d3.select("svg"), simulation, node, link, collapsed = false;
		    
		var color = d3.scaleOrdinal(d3.schemeCategory10);

		function init(){
			var dim = d3.select('body').node().getBoundingClientRect();

			svg.attr('width',dim.width);
			svg.attr('height',dim.height);

			svg.append('g').attr('class','links');
			svg.append('g').attr('class','nodes');

			simulation = d3.forceSimulation()
				.alphaTarget(1)
			    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(50))
			    .force("charge", d3.forceManyBody())
			    .force("center", d3.forceCenter(dim.width / 2, dim.height / 2))
			    .force('X',d3.forceX(dim.width/2))
			    .force('Y',d3.forceY(dim.height/2))
			    .on('tick',simulation_tick);

			d3.select('div#collapse-button').on('click',toggle_collapse_graph);

			graph.add_movie("Swades");
			update();    

		}    

		function toggle_collapse_graph(event){

			if(collapsed){
				collapsed = false;
				d3.select(this).text("Collapse");
			} else {
				collapsed = true;
				d3.select(this).text("Expand");
				graph.collapse_movies();
			}
			update();

			return null;
		}

		function update(){

			if(collapsed){ 
				graph.collapse_movies(); 
			}

			var nodes = graph.get_nodes(collapsed);
			var links = graph.get_links(collapsed);

			link = svg.select('g.links').selectAll('line').data(links);

			link.exit().remove();
			link.enter().append('line');

			node = svg.select('g.nodes').selectAll('circle').data(nodes);
			
			node.attr('fill',function(d){ return color(d.group); })
				.attr('r',function(d){return (d.group == 1 || d.group == 3 )? 5 : 10;})
				.select('title').text(function(d){ return d.id; });

			node.enter()
				.append('circle')
				.attr('fill',function(d){ return color(d.group); })
				.attr('r',function(d){return (d.group == 1 || d.group == 3 )? 5 : 10;})
				.call(d3.drag()
					.on('start',drag_started)
					.on('drag',drag)
					.on('end',drag_end))
				.append('title').text(function(d){return d.id;});;
			
			node.exit().remove();			
			
			link = svg.select('g.links').selectAll('line');
			node = svg.select('g.nodes').selectAll('circle');

			node.on('click', node_click);

			simulation.nodes(nodes);
			simulation.force('link').links(links);
			simulation.alphaTarget(1).restart();
		}

		function drag_started(d){
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function drag(d) {
			d.fx = d3.event.x;
  			d.fy = d3.event.y;
		}

		function drag_end(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
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
			graph.generalise_nodes();


			if(collapsed){
				return null;
			} else {
				if(data.group == 3){
					actor_click(data.id);
				} else if(data.group == 4){
					movie_click(data.id);
				}
			}

			function actor_click(actor){
				server.get_movies(actor,function(data, actor){
					var movies_not_there = graph.update_actor(actor,data);

					update();

					if(movies_not_there.length === 0){return;}
					movies_not_there.forEach(function(movie){
						server.get_actors(movie,function(actors, movie){
							graph.add_movie(movie,actors);
							update();
						});
					});
				});
			}

			function movie_click(movie){
				server.get_actors(movie,function(data, movie){
					var actors_not_there = graph.update_movie(movie,data);

					update();

					if( actors_not_there.length === 0 ){ return; }

					actors_not_there.forEach(function(actor){
						server.get_movies(actor,function(movies,actor){
							graph.add_actor(actor, movies);
							update();
						});
					});
				});
			}
		}

		init();

		return null;

	})();
