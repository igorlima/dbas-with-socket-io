define(['pubsub', 'jquery', 'io', 'colorpicker'], function(PubSub, $, io) {
  var socket = io();

  $('#editNodeModal #textColorNode').colorpicker();
  $('button.add-node').on('click', function() {
    PubSub.publish('forceView:addedNode', {});
  });

  $('button.remove-all-node').on('click', function() {
    socket.emit( 'remove-all-nodes' );
  });

  PubSub.subscribe('forceView:editedNode', function(msg, node) {
    $('#textColorNode').val(node.color);
    $('#textNode').val(node.label);
    $('#editNodeModal').modal('show');
    $('#editNodeModal button.btn.btn-primary')
      .off('click')
      .on('click', function(e) {
        socket.emit( 'edit-node', {
          id: node.id,
          color: $('#textColorNode').val(),
          label: $('#textNode').val()
        } );
        $('#editNodeModal').modal('hide');
      } );
  });
  PubSub.subscribe('forceView:addedNode', function(msg, node) {
    socket.emit( 'add-node', node );
  });
  PubSub.subscribe('forceView:addedLink', function(msg, link) {
    if (link.target.id) {
      socket.emit( 'add-link', link );
    }
  });

  PubSub.subscribe('forceView:addedNodeAndLink', function(msg, data) {
    socket.emit( 'add-node', data.node, function( node ) {
      data.node.id = node.id;
      PubSub.publish('forceView:addedLink', data.link);
    } );
  });

  PubSub.subscribe('forceView:deletedNode', function(msg, node) {
    socket.emit('remove-node', node);
  });
  PubSub.subscribe('forceView:deletedLink', function(msg, link) {
    socket.emit('remove-link', link);
  });
 
  PubSub.publish('forceView:deleteNode', {});

  return {
    init: function () {
      PubSub.publish('forceView:clear', function() {
        socket.on( 'node-added', function(node) {
          PubSub.publish('forceView:addNode', node );
          PubSub.publish('forceView:deleteNode', {});
        } );

        socket.on('node-removed', function(node) {
          PubSub.publish('forceView:deleteNode', node);
        });

        socket.on( 'node-edited', function(node) {
          PubSub.publish('forceView:editNode', node);
        } );

        socket.on( 'link-added', function(link) {
          PubSub.publish('forceView:addLink', link);
        } );

        socket.on( 'link-removed', function(link) {
          PubSub.publish('forceView:deleteLink', link);
        } );

        socket.emit('retrieve-all-nodes');
        console.log('appbaseSync loaded');
      });
    }
  };
});
