var express = require('express'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    Appbase = require('appbasejs'),
    extend  = require('extend');

/**
  NOTE: Remeber you are using my application sample_app_with_d3.
  Appbase is completely free up to 100 thousand API calls per month.
  Feel free to use it while you're learning.
  After that, create your own application's name,
  then new learners can use my API calls left. Thanks.
**/
Appbase.credentials("sample_app_with_d3", "3792bb2bddd86bf8f6a70522bae1f797");



app.use(express.static(__dirname + '/'));

io.on('connection', function(socket){
  var nsref = Appbase.ns( "my-first-namespace" );

  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('retrieve-all-nodes', function(  ) {
    nsref.on('vertex_added', function(err, vertexRef, obj) {

      socket.emit( 'node-added', extend( obj.properties() || {}, {
        id: vertexRef.name()
      } ) );

      vertexRef.on('properties', function(error, ref, snapObj) {
        socket.emit( 'node-edited', snapObj.properties() );
      });

      vertexRef.on('edge_added', function(error, edgeRef, snapObj) {
        vertexRef.once('properties', function(error_source, ref_target, obj_target) {
          edgeRef && edgeRef.once('properties', function(error_target, ref_source, obj_source) {
            socket.emit( 'link-added', {
              source: obj_source.properties(),
              target: obj_target.properties(),
              id: edgeRef.name()
            });
          });
        });
      });

      vertexRef.on('edge_removed', function(error, edgeRef, snapObj) {
        socket.emit( 'link-removed' , {id: edgeRef.name()});
      });

    });

    nsref.on('vertex_removed', function(err, vertexRef, obj) {
      socket.emit( 'node-removed', obj.properties() );
    });

  });

  socket.on('remove-all-nodes', function() {
    nsref.on('vertex_added', function(err, vertexRef, obj) {
      if (err) {
        console.error( 'remove-all-nodes', err );
      } else {
        vertexRef.destroy();
        socket.emit( 'node-removed', vertexRef.name() );
      }
    });
  });

  socket.on('add-node', function( node, cb ) {
    var id = Appbase.uuid(), vref = nsref.v(id);
    node.id = id;
    vref.setData(node);

    if (cb) {
      cb(node);
    } else {
      socket.emit( 'node-added', node );
    }
  });

  socket.on('edit-node', function(node) {
    if (node && node.id) {
      nsref.v(node.id).setData(node);
      socket.emit( 'node-edited', node );
    }
  } );

  socket.on('remove-node', function(node) {
    if (node && node.id) {
      nsref.v(node.id).destroy();
      socket.emit( 'node-removed', node.id );
    }
  });

  socket.on('add-link', function(link) {
    var source, target, id;
    if (!link || !link.source || !link.target || !link.source.id || !link.target.id) return;
    source = nsref.v(link.source.id);
    target = nsref.v(link.target.id);
    id = Appbase.uuid();
    source.setEdge( id, target, function(error) {
      if (error) {
        console.error( 'add-link', error );
      } else {
        link.id = id;
        socket.emit( 'link-added', link );
      }
    } );
  });

  socket.on('remove-link', function(link) {
    if (link && link.id) {
      nsref.v( link.target.id ).removeEdge( [link.id] );
      socket.emit( 'link-removed', link );
    }
  });

});


http.listen(process.env.PORT || 5000, function(){
  console.log('listening on *:5000');
});

