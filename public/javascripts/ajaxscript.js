function addToCart(productId){
    $.ajax({
        url:'/addToCart/'+productId,
        method:'get',
        success:(response)=>{
            if(response){

                if(response.added){
                    Swal.fire({
                        icon: 'success',
                        title: '',
                        text: 'Added to cart',
                        footer: ''
                      })

                    let count=$('#cart-count').html()
                    count=parseInt(count)+1
                    $("#cart-count").html(count)
                }
              

              if(response.newCart){
                Swal.fire({
                    icon: 'success',
                    title: '',
                    text: 'Added to cart',
                    footer: ''
                  })
                  let count=$('#cart-count').html()
                    count=parseInt(count)+1
                    $("#cart-count").html(count)   
              }  
                

                

            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Please Login!',
                    footer: '<a href="/login">Login</a>'
                  })
            }
            
        }
    })
}

function addToWishList(productId){
    
    $.ajax({
        
        url:'/addToWishList/'+productId,
        method:'get',
        success:(response)=>{
            if(response.added){
                Swal.fire({
                    icon: 'success',
                    title: '',
                    text: 'Added to wishList',
                    footer: ''
                  })

                  let count=$('#wishlist-count').html()
                  count=parseInt(count)+1
                  $("#wishlist-count").html(count)

            } 
            if(response.productAlreadyInWishList){
                Swal.fire({
                    icon: 'error',
                    title: '',
                    text: 'Product Already in Wish-list',
                    footer: ''
                  })
            } 
            
            
        }
    })
}




