//
//  ViewController.swift
//  WebAuthnKitSafari
//
//  Created by Yubico Developer Program on 11/9/20
//
import UIKit
import SafariServices

class ViewController: UIViewController, SFSafariViewControllerDelegate {

    @IBOutlet weak var btnLaunch: UIButton!
    private var safariVC: SFSafariViewController? = nil
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    // Launch SafariViewController with web url specified in the Constants.json file
    @IBAction func btnLaunchSafariVC(_ sender: Any) {
        guard let jsonConfig = readJSONFromFile(fileName: "Constants", type: AppConfig.self) else { return }
        safariVC = SFSafariViewController(url: URL(string: jsonConfig.starterKitWebURL)!)
        safariVC?.configuration.entersReaderIfAvailable = true
        safariVC?.configuration.barCollapsingEnabled = true
        safariVC?.delegate = self
        self.present(safariVC!, animated: true, completion: nil)
    }
    
    // Read the constants from the local Constants.json file
    func readJSONFromFile<T: Decodable>(fileName: String, type: T.Type) -> T? {
        if let url = Bundle.main.url(forResource: fileName, withExtension: "json") {
            do {
                let data = try Data(contentsOf: url)
                let decoder = JSONDecoder()
                let jsonData = try decoder.decode(T.self, from: data)
                return jsonData
            } catch {
                print("error:\(error)")
            }
        }
        return nil
    }
    
    // Callback when user taps 'Done' in the SFSafariViewController
    private func safariViewControllerDidFinish(controller: SFSafariViewController) {
        safariVC?.dismiss(animated: true, completion: nil)
    }
    
    struct AppConfig: Codable {
        let starterKitWebURL: String
    }
}

