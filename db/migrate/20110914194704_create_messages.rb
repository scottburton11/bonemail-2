class CreateMessages < ActiveRecord::Migration
  def change
    create_table :messages, :force => true do |t|
      t.string :subject
      t.string :body
      t.timestamps
    end
  end
end
