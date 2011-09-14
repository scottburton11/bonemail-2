class MessagesController < ApplicationController
  respond_to :json
  
  def index
    @messages = Message.all
    respond_with @messages
  end

  def destroy
    @message = Message.find(params[:id])
    @message.destroy
    respond_with @message
  end

  def show
    @message = Message.find(params[:id])
    respond_with @message
  end
end
