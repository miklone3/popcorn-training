(function() {
  "use strict";

  window.App = {
    Setting:{
      apiKey: "c2556faf7036f7827784ff008ff0478e",
      baseUrl:  "http://api.themoviedb.org/3"
  
    },
    Collections:{}
  }

  App.Collections.favoriteMovie = [];

  var MovieModel = function( id, urlImg, title ){
    this.id = id,
    this.img = urlImg,
    this.title = title
  }

  var MovieCollections = function(){
    this.movies = []
  };

  var template = function(id){
    return _.template( $("#"+id).html() );
  };

  App.initUrl = function( type, info ){
    return App.Setting.baseUrl + '/'+type+'/'+info+'?api_key=' + App.Setting.apiKey;
  }

  //LOCALSTORAGE SECTION 

  App.initLocalStorage = function(){
    if(!localStorage["favorite"]){
      localStorage["favorite"] = JSON.stringify( App.Collections.favoriteMovie );
    }else{
      App.Collections.favoriteMovie = App.getLocalStorage();
    }
  }

  App.saveLocalStorage = function( collection ){
    localStorage["favorite"] = JSON.stringify( collection );
  };

  App.getLocalStorage = function(){
     var movieFavorite = JSON.parse( localStorage["favorite"] );
     return movieFavorite;
  };

  App.loadFavoriteMovie = function(){
    App.renderCollection( App.getLocalStorage() ,'favorite')
  };

  App.findLocalStorage = function( id ){
    App.Collections.favoriteMovie = App.getLocalStorage();
    var estado = true;
    for(var i = App.Collections.favoriteMovie.length - 1; i >= 0; i--) {
      if(App.Collections.favoriteMovie[i].id == id) {
        estado = false;  
        break;
      }
    }
    return estado;
  }

  //RENDERS

  App.renderCollection = function( collection, container ){
    var $list = $('<ul>');
    _.each(collection, function(item){
      App.render( item, $list );
    });
    App.renderView($list, container);
  };

  App.render = function( item, container ){ 
    var templates = template( 'templateMovie' );
    container.append( templates( item ) );
  }

  App.renderView = function( item, container ){
    $( '#'+container ).html( item.html() );
  }

  App.saveMovies = function( data, container, collection ){
    _.each(data, function(item){
      var movie = new MovieModel(item.id, item.poster_path, item.title );
      collection.movies.push(movie);
    });
    App.renderCollection(collection.movies, container)
  };

  //Getters

  App.getMovies = function( url, container, collection ){
    $.ajax({
      url: url,
      success: function(data){
        App.saveMovies( data.results, container, collection );
      }
    });
  };

  App.getMovie = function( url , fallback){
    $.ajax({
      url: url,
      success: function(data){
        fallback.apply(this, [data]);
      }
    });
  };

  App.getCast = function(id, fallback){
    var url = App.initUrl('movie', id+'/credits');
    $.ajax({
      url: url,
      success: function(data){
        fallback.apply(this, [data]);
      }
    });
  }

  App.getMovieDetail = function(id){
    var url = App.initUrl('movie', id);
    var modalMovie;
    $.ajax({
      url: url,
      success: function(data){
        var estado = App.findLocalStorage( id );
        modalMovie = {
          id: data.id,
          title: data.title,
          img: data.poster_path,
          casts: [],
          overview: data.overview,
          year: data.release_date,
          status: estado
        };
        App.getCast(id, function(data) {
          _.each(data.cast, function(cast){
            var casting = {
              name: cast.name,
              character: cast.character,
              img: cast.profile_path
            };
            modalMovie.casts.push(casting);
          });
          var tmp = template("templateModal")(modalMovie);
          App.openModal( tmp );
        });
      }
    });
  };

  App.addFavorite = function( item ){

    var id = $(item).attr('href'),
    url = App.initUrl('movie', id);

    App.Collections.favoriteMovie = App.getLocalStorage();

    if( App.findLocalStorage( id ) ){
      App.getMovie( url , function(data){
        var movie = new MovieModel(data.id, data.poster_path, data.title );
        App.Collections.favoriteMovie.push( movie );
        App.saveLocalStorage(App.Collections.favoriteMovie);
        App.loadFavoriteMovie()
      })
    }else{
      alert("esta pelicula ya fue añadida a la lista")
    }
  }

  App.removeFavorite = function( item ){
    App.Collections.favoriteMovie = App.getLocalStorage();
    var id = $(item).attr('href');
    for(var i = App.Collections.favoriteMovie.length - 1; i >= 0; i--) {
      if(App.Collections.favoriteMovie[i].id == id) {
         App.Collections.favoriteMovie.splice(i, 1);
         App.saveLocalStorage(App.Collections.favoriteMovie);
         App.loadFavoriteMovie();
         App.closeModal();
         break;
      }
    }
  }

  App.favoriteEvent = function(){
    $('.js-add-favorite').on('click',function(e){
      e.preventDefault();
      App.addFavorite( this );
    });

    $('.js-remove-favorite').on('click',function(e){
      e.preventDefault();
      App.removeFavorite( this );
    });
  }

  App.openModal = function( tmp ){ 
    $.magnificPopup.open({
      items:{
        src: tmp
      }, 
      type:'inline'
    });
    App.favoriteEvent();
  }

  App.closeModal = function(){ 
    $.magnificPopup.close();
  }

  App.initModalbox = function(){
    $('.movie-list').on('click','.js-modal', function(e){
      e.preventDefault();
      App.getMovieDetail( $(this).attr('href') );
    });
  };


  App.Collections.MoviesPopular = new MovieCollections();
  App.Collections.MoviesTopRated = new MovieCollections();

  var moviesPopularUrl = App.initUrl( 'movie', 'popular'),
  moviesTopRatedUrl = App.initUrl( 'movie', 'top_rated');

  App.initLocalStorage();
  App.loadFavoriteMovie();
  App.initModalbox();

  App.getMovies(  moviesPopularUrl, 'popular', App.Collections.MoviesPopular );
  App.getMovies(  moviesTopRatedUrl, 'top_rated', App.Collections.MoviesTopRated );


})();
