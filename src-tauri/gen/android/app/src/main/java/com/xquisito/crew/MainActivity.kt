package com.xquisito.crew

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import com.google.firebase.messaging.FirebaseMessaging
import java.io.File

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    createNotificationChannel()

    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
      if (task.isSuccessful) {
        val token = task.result
        saveFcmTokenToFile(token)
      }
    }
  }

  fun saveFcmTokenToFile(token: String) {
    // Escribir en filesDir (ruta canónica para Rust)
    try { File(filesDir, "fcm_token.txt").writeText(token) } catch (_: Exception) {}
    // Escribir también en getExternalFilesDir por si la ruta interna difiere
    try { File(getExternalFilesDir(null), "fcm_token.txt")?.writeText(token) } catch (_: Exception) {}
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        "kitchen_orders",
        "Órdenes de cocina",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Notificaciones de nuevas órdenes"
        enableVibration(true)
      }
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }
}
