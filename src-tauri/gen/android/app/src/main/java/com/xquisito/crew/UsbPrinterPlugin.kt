package com.xquisito.crew

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSArray
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.starmicronics.stario10.InterfaceType
import com.starmicronics.stario10.StarConnectionSettings
import com.starmicronics.stario10.StarDeviceDiscoveryManager
import com.starmicronics.stario10.StarDeviceDiscoveryManagerFactory
import com.starmicronics.stario10.StarPrinter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@InvokeArg
class PrintRawArgs {
    lateinit var deviceName: String
    lateinit var data: List<Int>
}

@InvokeArg
class PrintTestArgs {
    lateinit var deviceName: String
}

@TauriPlugin
class UsbPrinterPlugin(private val activity: Activity) : Plugin(activity) {

    private var discoveryManager: StarDeviceDiscoveryManager? = null

    @Command
    fun listDevices(invoke: Invoke) {
        val found = mutableListOf<StarPrinter>()
        activity.runOnUiThread {
            try {
                val manager = StarDeviceDiscoveryManagerFactory.create(
                    listOf(InterfaceType.Usb),
                    activity
                )
                discoveryManager = manager
                manager.discoveryTime = 10000
                manager.callback = object : StarDeviceDiscoveryManager.Callback {
                    override fun onPrinterFound(printer: StarPrinter) {
                        found.add(printer)
                    }
                    override fun onDiscoveryFinished() {
                        discoveryManager = null
                        val arr = JSArray()
                        for (printer in found) {
                            arr.put(JSObject().apply {
                                put("device_name", printer.connectionSettings.identifier)
                                put("vendor_id", 0)
                                put("product_id", 0)
                                put("is_printer_class", true)
                            })
                        }
                        invoke.resolveObject(JSObject("{\"devices\":$arr}"))
                    }
                }
                manager.startDiscovery()
            } catch (e: Exception) {
                discoveryManager = null
                invoke.reject(e.message ?: "Error en descubrimiento USB")
            }
        }
    }

    @Command
    fun printRaw(invoke: Invoke) {
        val args = invoke.parseArgs(PrintRawArgs::class.java)
        CoroutineScope(Dispatchers.IO).launch {
            val printer = StarPrinter(
                StarConnectionSettings(InterfaceType.Usb, args.deviceName),
                activity
            )
            try {
                printer.openAsync().await()
                val data = args.data.map { it.toByte() }
                printer.printRawDataAsync(data).await()
                withContext(Dispatchers.Main) { invoke.resolve() }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    invoke.reject(e.message ?: "Error imprimiendo")
                }
            } finally {
                try { printer.closeAsync().await() } catch (_: Exception) {}
            }
        }
    }

    @Command
    fun printTest(invoke: Invoke) {
        val args = invoke.parseArgs(PrintTestArgs::class.java)
        CoroutineScope(Dispatchers.IO).launch {
            val printer = StarPrinter(
                StarConnectionSettings(InterfaceType.Usb, args.deviceName),
                activity
            )
            try {
                printer.openAsync().await()
                printer.printRawDataAsync(buildTestTicket().toList()).await()
                withContext(Dispatchers.Main) { invoke.resolve() }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    invoke.reject(e.message ?: "Error en prueba de impresión")
                }
            } finally {
                try { printer.closeAsync().await() } catch (_: Exception) {}
            }
        }
    }

    private fun buildTestTicket(): ByteArray {
        val ts = java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss", java.util.Locale.getDefault())
            .format(java.util.Date())
        val buf = mutableListOf<Byte>()
        buf += listOf(0x1B, 0x40).map { it.toByte() }
        buf += listOf(0x1B, 0x61, 0x00).map { it.toByte() }
        buf += listOf(0x1B, 0x21, 0x30).map { it.toByte() }
        buf += "\n== CUENTA NUEVA ==\n".toByteArray(Charsets.US_ASCII).toList()
        buf += listOf(0x1B, 0x21, 0x10).map { it.toByte() }
        buf += "\nXQUISITO PRINT USB\n".toByteArray(Charsets.US_ASCII).toList()
        buf += "$ts\n".toByteArray(Charsets.US_ASCII).toList()
        buf += "========================\n".toByteArray(Charsets.US_ASCII).toList()
        buf += "Asigna nombre y rol\n".toByteArray(Charsets.US_ASCII).toList()
        buf += "desde Impresoras.\n".toByteArray(Charsets.US_ASCII).toList()
        buf += "========================\n".toByteArray(Charsets.US_ASCII).toList()
        buf += listOf(0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00).map { it.toByte() }
        return buf.toByteArray()
    }
}
